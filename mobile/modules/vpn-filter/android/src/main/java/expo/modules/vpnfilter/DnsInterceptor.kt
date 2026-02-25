package expo.modules.vpnfilter

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer

/**
 * Handles DNS packet parsing, domain extraction, NXDOMAIN response crafting,
 * and forwarding legitimate queries to upstream DNS.
 *
 * IP packet layout:
 *   [IP Header 20 bytes] [UDP Header 8 bytes] [DNS Payload]
 *
 * DNS Header (12 bytes):
 *   Transaction ID (2), Flags (2), Questions (2), Answers (2), Authority (2), Additional (2)
 *
 * DNS Question:
 *   QNAME (variable: length-prefixed labels ending with 0x00), QTYPE (2), QCLASS (2)
 */
object DnsInterceptor {

  private const val IP_HEADER_SIZE = 20
  private const val UDP_HEADER_SIZE = 8
  private const val DNS_HEADER_SIZE = 12
  private const val PROTOCOL_UDP: Byte = 17
  private const val DNS_PORT = 53

  private val UPSTREAM_DNS = InetAddress.getByName("8.8.8.8")
  private val UPSTREAM_DNS_2 = InetAddress.getByName("1.1.1.1")

  data class DnsQueryInfo(
    val domain: String,
    val transactionId: Int,
    val sourceIp: ByteArray,
    val destIp: ByteArray,
    val sourcePort: Int,
    val destPort: Int,
    val dnsPayload: ByteArray,
    val fullPacket: ByteArray,
  )

  /**
   * Parse a raw IP packet from the TUN interface.
   * Returns DnsQueryInfo if it's a DNS query, null otherwise.
   */
  fun parseDnsQuery(packet: ByteArray, length: Int): DnsQueryInfo? {
    if (length < IP_HEADER_SIZE + UDP_HEADER_SIZE + DNS_HEADER_SIZE) return null

    val buf = ByteBuffer.wrap(packet, 0, length)

    // ── IP Header ──
    val versionIhl = buf.get(0).toInt() and 0xFF
    val version = versionIhl shr 4
    if (version != 4) return null // IPv4 only

    val ihl = (versionIhl and 0x0F) * 4
    val protocol = buf.get(9)
    if (protocol != PROTOCOL_UDP) return null

    val sourceIp = ByteArray(4)
    val destIp = ByteArray(4)
    buf.position(12)
    buf.get(sourceIp)
    buf.get(destIp)

    // ── UDP Header ──
    buf.position(ihl)
    val sourcePort = buf.short.toInt() and 0xFFFF
    val destPort = buf.short.toInt() and 0xFFFF

    if (destPort != DNS_PORT) return null

    val udpLength = buf.short.toInt() and 0xFFFF
    buf.short // skip checksum

    // ── DNS Payload ──
    val dnsOffset = ihl + UDP_HEADER_SIZE
    val dnsLength = length - dnsOffset
    if (dnsLength < DNS_HEADER_SIZE) return null

    val dnsPayload = ByteArray(dnsLength)
    System.arraycopy(packet, dnsOffset, dnsPayload, 0, dnsLength)

    // Transaction ID
    val transactionId = ((dnsPayload[0].toInt() and 0xFF) shl 8) or
                        (dnsPayload[1].toInt() and 0xFF)

    // Parse domain from question section
    val domain = extractDomain(dnsPayload) ?: return null

    return DnsQueryInfo(
      domain = domain,
      transactionId = transactionId,
      sourceIp = sourceIp,
      destIp = destIp,
      sourcePort = sourcePort,
      destPort = destPort,
      dnsPayload = dnsPayload,
      fullPacket = packet.copyOf(length),
    )
  }

  /**
   * Extract domain name from DNS payload.
   * Labels format: [len][chars][len][chars]...[0x00]
   */
  private fun extractDomain(dns: ByteArray): String? {
    if (dns.size < DNS_HEADER_SIZE + 1) return null

    val sb = StringBuilder()
    var pos = DNS_HEADER_SIZE // skip header

    while (pos < dns.size) {
      val labelLen = dns[pos].toInt() and 0xFF
      if (labelLen == 0) break
      if (labelLen > 63) return null // compression pointer or invalid

      pos++
      if (pos + labelLen > dns.size) return null

      if (sb.isNotEmpty()) sb.append('.')
      for (i in 0 until labelLen) {
        sb.append(dns[pos + i].toInt().toChar())
      }
      pos += labelLen
    }

    return if (sb.isNotEmpty()) sb.toString().lowercase() else null
  }

  /**
   * Build NXDOMAIN response packet (IP + UDP + DNS).
   * Swaps source/dest from original query.
   */
  fun buildNxdomainResponse(query: DnsQueryInfo): ByteArray {
    // Build DNS NXDOMAIN response
    val dnsResponse = buildDnsNxdomain(query.dnsPayload)

    // Build UDP header
    val udpLength = UDP_HEADER_SIZE + dnsResponse.size
    val udpHeader = ByteBuffer.allocate(UDP_HEADER_SIZE)
    udpHeader.putShort(query.destPort.toShort()) // swap: dest -> source
    udpHeader.putShort(query.sourcePort.toShort()) // swap: source -> dest
    udpHeader.putShort(udpLength.toShort())
    udpHeader.putShort(0) // checksum = 0 (optional for IPv4 UDP)

    // Build IP header
    val totalLength = IP_HEADER_SIZE + udpLength
    val ipHeader = ByteBuffer.allocate(IP_HEADER_SIZE)
    ipHeader.put((0x45).toByte()) // version=4, IHL=5
    ipHeader.put(0.toByte()) // DSCP/ECN
    ipHeader.putShort(totalLength.toShort())
    ipHeader.putShort(0) // identification
    ipHeader.putShort(0x4000.toShort()) // flags: Don't Fragment
    ipHeader.put(64.toByte()) // TTL
    ipHeader.put(PROTOCOL_UDP) // protocol
    ipHeader.putShort(0) // checksum placeholder
    ipHeader.put(query.destIp) // swap: dest -> source
    ipHeader.put(query.sourceIp) // swap: source -> dest

    // Calculate IP checksum
    val ipBytes = ipHeader.array()
    val checksum = calculateIpChecksum(ipBytes)
    ipBytes[10] = (checksum shr 8).toByte()
    ipBytes[11] = (checksum and 0xFF).toByte()

    // Assemble full packet
    val result = ByteArray(totalLength)
    System.arraycopy(ipBytes, 0, result, 0, IP_HEADER_SIZE)
    System.arraycopy(udpHeader.array(), 0, result, IP_HEADER_SIZE, UDP_HEADER_SIZE)
    System.arraycopy(dnsResponse, 0, result, IP_HEADER_SIZE + UDP_HEADER_SIZE, dnsResponse.size)

    return result
  }

  /**
   * Build DNS NXDOMAIN payload.
   * Copies question from original query, sets NXDOMAIN rcode.
   */
  private fun buildDnsNxdomain(originalDns: ByteArray): ByteArray {
    // Copy entire DNS payload to preserve question section
    val response = originalDns.copyOf()

    // Set flags: 0x8183 = Response, Recursion Desired, Recursion Available, NXDOMAIN (rcode=3)
    response[2] = 0x81.toByte()
    response[3] = 0x83.toByte()

    // Zero out answer, authority, additional counts
    response[6] = 0; response[7] = 0 // answers
    response[8] = 0; response[9] = 0 // authority
    response[10] = 0; response[11] = 0 // additional

    return response
  }

  /**
   * Forward DNS query to upstream DNS and return the response wrapped in IP+UDP.
   */
  fun forwardDnsQuery(query: DnsQueryInfo, vpnSocket: DatagramSocket): ByteArray? {
    return try {
      // Send query to upstream DNS
      val sendPacket = DatagramPacket(query.dnsPayload, query.dnsPayload.size, UPSTREAM_DNS, DNS_PORT)
      vpnSocket.send(sendPacket)

      // Receive response
      val recvBuf = ByteArray(4096)
      val recvPacket = DatagramPacket(recvBuf, recvBuf.size)
      vpnSocket.soTimeout = 5000 // 5s timeout
      vpnSocket.receive(recvPacket)

      val dnsResponse = recvBuf.copyOf(recvPacket.length)

      // Wrap in IP + UDP with swapped addresses
      wrapDnsResponse(query, dnsResponse)
    } catch (e: Exception) {
      // Try secondary DNS
      try {
        val sendPacket = DatagramPacket(query.dnsPayload, query.dnsPayload.size, UPSTREAM_DNS_2, DNS_PORT)
        vpnSocket.send(sendPacket)
        val recvBuf = ByteArray(4096)
        val recvPacket = DatagramPacket(recvBuf, recvBuf.size)
        vpnSocket.soTimeout = 5000
        vpnSocket.receive(recvPacket)
        val dnsResponse = recvBuf.copyOf(recvPacket.length)
        wrapDnsResponse(query, dnsResponse)
      } catch (e2: Exception) {
        null
      }
    }
  }

  private fun wrapDnsResponse(query: DnsQueryInfo, dnsResponse: ByteArray): ByteArray {
    val udpLength = UDP_HEADER_SIZE + dnsResponse.size
    val totalLength = IP_HEADER_SIZE + udpLength

    val packet = ByteBuffer.allocate(totalLength)

    // IP Header
    packet.put((0x45).toByte())
    packet.put(0.toByte())
    packet.putShort(totalLength.toShort())
    packet.putShort(0)
    packet.putShort(0x4000.toShort())
    packet.put(64.toByte())
    packet.put(PROTOCOL_UDP)
    packet.putShort(0) // checksum placeholder
    packet.put(query.destIp) // source = original dest (DNS server)
    packet.put(query.sourceIp) // dest = original source (our app)

    // UDP Header
    packet.putShort(query.destPort.toShort()) // source port = DNS port
    packet.putShort(query.sourcePort.toShort()) // dest port = original source
    packet.putShort(udpLength.toShort())
    packet.putShort(0)

    // DNS payload
    packet.put(dnsResponse)

    val result = packet.array()

    // Calculate IP checksum
    val checksum = calculateIpChecksum(result)
    result[10] = (checksum shr 8).toByte()
    result[11] = (checksum and 0xFF).toByte()

    return result
  }

  private fun calculateIpChecksum(header: ByteArray): Int {
    var sum = 0
    for (i in 0 until IP_HEADER_SIZE step 2) {
      val word = ((header[i].toInt() and 0xFF) shl 8) or (header[i + 1].toInt() and 0xFF)
      sum += word
    }
    // Fold 32-bit sum to 16 bits
    while (sum shr 16 != 0) {
      sum = (sum and 0xFFFF) + (sum shr 16)
    }
    return sum.inv() and 0xFFFF
  }
}
