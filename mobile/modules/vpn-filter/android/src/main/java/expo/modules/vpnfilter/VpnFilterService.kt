package expo.modules.vpnfilter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramSocket
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import org.json.JSONArray

class VpnFilterService : VpnService() {

  companion object {
    const val TAG = "VpnFilter"
    const val CHANNEL_ID = "vpn_filter_channel"
    const val NOTIFICATION_ID = 1001
    const val PREFS_NAME = "vpn_filter_stats"
    const val KEY_BLOCKED_TODAY = "blocked_today"
    const val KEY_BLOCKED_DATE = "blocked_date"
    const val KEY_RECENT_DOMAINS = "recent_domains"
    const val KEY_MODE = "vpn_mode" // "soft" or "strict"
    const val KEY_STRICT_ACTIVATED_AT = "strict_activated_at"
    const val KEY_TOTAL_BLOCKED = "total_blocked"

    const val ACTION_START = "START"
    const val ACTION_STOP = "STOP"

    private const val VPN_ADDRESS = "10.0.0.2"
    private const val VPN_DNS = "10.0.0.1"
    private const val VPN_ROUTE = "10.0.0.1"
    private const val MAX_RECENT_DOMAINS = 50
    private const val MAX_PACKET_SIZE = 32767

    @Volatile
    var isRunning = false
      private set

    @Volatile
    var blockedToday = AtomicInteger(0)
  }

  private var vpnInterface: ParcelFileDescriptor? = null
  private var workerThread: Thread? = null
  private val running = AtomicBoolean(false)

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    DomainBlockList.init(this)
    loadTodayStats()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopVpn()
        return START_NOT_STICKY
      }
      else -> {
        startVpn()
        return START_STICKY
      }
    }
  }

  override fun onDestroy() {
    stopVpn()
    super.onDestroy()
  }

  private fun startVpn() {
    if (running.get()) return

    try {
      val builder = Builder()
        .setSession("SafeBet VPN Filter")
        .addAddress(VPN_ADDRESS, 32)
        .addDnsServer(VPN_DNS)
        .addRoute(VPN_ROUTE, 32) // Only route DNS traffic
        .setBlocking(true)
        .setMtu(MAX_PACKET_SIZE)

      // Allow bypass for the app itself to avoid loops
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        builder.setMetered(false)
      }

      vpnInterface = builder.establish()

      if (vpnInterface == null) {
        Log.e(TAG, "Failed to establish VPN interface")
        stopSelf()
        return
      }

      running.set(true)
      isRunning = true

      startForeground(NOTIFICATION_ID, buildNotification())

      workerThread = Thread({ runVpnLoop() }, "VpnFilterWorker").also {
        it.isDaemon = true
        it.start()
      }

      Log.i(TAG, "VPN filter started")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to start VPN: ${e.message}")
      stopVpn()
    }
  }

  private fun stopVpn() {
    running.set(false)
    isRunning = false

    workerThread?.interrupt()
    workerThread = null

    try {
      vpnInterface?.close()
    } catch (e: Exception) {
      Log.w(TAG, "Error closing VPN interface: ${e.message}")
    }
    vpnInterface = null

    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()

    Log.i(TAG, "VPN filter stopped")
  }

  private fun runVpnLoop() {
    val vpnFd = vpnInterface ?: return
    val input = FileInputStream(vpnFd.fileDescriptor)
    val output = FileOutputStream(vpnFd.fileDescriptor)
    val packet = ByteArray(MAX_PACKET_SIZE)

    // Create protected UDP socket for forwarding DNS
    val dnsSocket = DatagramSocket()
    protect(dnsSocket) // Critical: prevent routing loop

    try {
      while (running.get() && !Thread.currentThread().isInterrupted) {
        val length = input.read(packet)
        if (length <= 0) continue

        val query = DnsInterceptor.parseDnsQuery(packet, length) ?: continue

        if (DomainBlockList.isDomainBlocked(query.domain)) {
          // Blocked — send NXDOMAIN
          val response = DnsInterceptor.buildNxdomainResponse(query)
          output.write(response)
          output.flush()

          onDomainBlocked(query.domain)
          Log.d(TAG, "Blocked: ${query.domain}")
        } else {
          // Allowed — forward to upstream DNS
          val response = DnsInterceptor.forwardDnsQuery(query, dnsSocket)
          if (response != null) {
            output.write(response)
            output.flush()
          }
        }
      }
    } catch (e: Exception) {
      if (running.get()) {
        Log.e(TAG, "VPN loop error: ${e.message}")
      }
    } finally {
      dnsSocket.close()
    }
  }

  private fun onDomainBlocked(domain: String) {
    val count = blockedToday.incrementAndGet()
    saveBlockedDomain(domain)
    saveTodayStats(count)

    // Update notification every 5 blocks
    if (count % 5 == 0 || count <= 3) {
      updateNotification(count)
    }

    // Send notification in soft mode
    val mode = getPrefs().getString(KEY_MODE, "soft")
    if (mode == "soft") {
      sendBlockNotification(domain)
    }
  }

  private fun saveBlockedDomain(domain: String) {
    val prefs = getPrefs()
    val existing = prefs.getString(KEY_RECENT_DOMAINS, "[]")
    try {
      val arr = JSONArray(existing)
      // Add to front
      val newArr = JSONArray()
      newArr.put(domain)
      for (i in 0 until minOf(arr.length(), MAX_RECENT_DOMAINS - 1)) {
        newArr.put(arr.getString(i))
      }
      prefs.edit().putString(KEY_RECENT_DOMAINS, newArr.toString()).apply()
    } catch (e: Exception) {
      val arr = JSONArray()
      arr.put(domain)
      prefs.edit().putString(KEY_RECENT_DOMAINS, arr.toString()).apply()
    }
  }

  private fun sendBlockNotification(domain: String) {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
        .setContentTitle("Заблокирован gambling-сайт")
        .setContentText("Домен $domain был заблокирован. Всё в порядке?")
        .setSmallIcon(android.R.drawable.ic_dialog_alert)
        .setAutoCancel(true)
        .build()
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
        .setContentTitle("Заблокирован gambling-сайт")
        .setContentText("Домен $domain был заблокирован. Всё в порядке?")
        .setSmallIcon(android.R.drawable.ic_dialog_alert)
        .setAutoCancel(true)
        .build()
    }

    nm.notify(NOTIFICATION_ID + 100 + (System.currentTimeMillis() % 100).toInt(), notification)
  }

  // ── Stats ──

  private fun loadTodayStats() {
    val prefs = getPrefs()
    val savedDate = prefs.getString(KEY_BLOCKED_DATE, "")
    val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
      .format(java.util.Date())

    if (savedDate == today) {
      blockedToday.set(prefs.getInt(KEY_BLOCKED_TODAY, 0))
    } else {
      // New day — reset
      blockedToday.set(0)
      prefs.edit()
        .putInt(KEY_BLOCKED_TODAY, 0)
        .putString(KEY_BLOCKED_DATE, today)
        .putString(KEY_RECENT_DOMAINS, "[]")
        .apply()
    }
  }

  private fun saveTodayStats(count: Int) {
    val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
      .format(java.util.Date())
    val prefs = getPrefs()

    val total = prefs.getLong(KEY_TOTAL_BLOCKED, 0L) + 1

    prefs.edit()
      .putInt(KEY_BLOCKED_TODAY, count)
      .putString(KEY_BLOCKED_DATE, today)
      .putLong(KEY_TOTAL_BLOCKED, total)
      .apply()
  }

  // ── Notifications ──

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "VPN-защита",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Постоянное уведомление о работе VPN-фильтра"
        setShowBadge(false)
      }
      val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      nm.createNotificationChannel(channel)
    }
  }

  private fun buildNotification(blockedCount: Int = blockedToday.get()): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val pendingIntent = PendingIntent.getActivity(
      this, 0, launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
        .setContentTitle("Защита активна")
        .setContentText("Заблокировано сегодня: $blockedCount")
        .setSmallIcon(android.R.drawable.ic_lock_lock)
        .setContentIntent(pendingIntent)
        .setOngoing(true)
        .build()
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
        .setContentTitle("Защита активна")
        .setContentText("Заблокировано сегодня: $blockedCount")
        .setSmallIcon(android.R.drawable.ic_lock_lock)
        .setContentIntent(pendingIntent)
        .setOngoing(true)
        .build()
    }
  }

  private fun updateNotification(blockedCount: Int) {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(NOTIFICATION_ID, buildNotification(blockedCount))
  }

  private fun getPrefs(): SharedPreferences {
    return getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  }
}
