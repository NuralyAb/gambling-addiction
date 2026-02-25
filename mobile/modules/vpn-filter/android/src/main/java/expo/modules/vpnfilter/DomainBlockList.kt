package expo.modules.vpnfilter

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray

object DomainBlockList {

  private const val PREFS_NAME = "vpn_filter_domains"
  private const val KEY_DOMAINS = "blocked_domains"
  private const val KEY_UPDATED_AT = "domains_updated_at"

  @Volatile
  private var cachedDomains: Set<String> = emptySet()

  @Volatile
  private var initialized = false

  private val DEFAULT_DOMAINS = setOf(
    // ── Major gambling sites ──
    "1xbet.com", "1xbet.ru", "1xstavka.ru",
    "fonbet.ru", "fonbet.com",
    "olimpbet.ru", "olimp.bet",
    "winline.ru",
    "parimatch.ru", "parimatch.com",
    "mostbet.com", "mostbet.ru",
    "melbet.com", "melbet.ru",
    "betcity.ru",
    "leon.ru", "leonbets.com",
    "betboom.ru",
    "ligastavok.ru",
    "marathonbet.com", "marathonbet.ru",
    "pin-up.ru", "pinup.ru", "pin-up.com",
    "vavada.com", "vavada.ru",
    "vulkan.com", "vulkan.ru", "vulkanvegas.com",
    "joycasino.com", "joycasino.ru",
    "azino777.com", "azino777.ru",
    "pokerstars.com", "pokerstars.ru",
    "ggpoker.com", "ggpoker.ru",
    "bet365.com",
    "bwin.com",
    "betway.com",
    "888casino.com", "888poker.com", "888sport.com",
    "betwinner.com",
    "stake.com",
    "rollbit.com",
    "roobet.com",
    "gamdom.com",
    "duelbits.com",
    "1win.com", "1win.ru",
    "fairspin.io",
    "bitcasino.io",
    "cloudbet.com",
    "sportsbet.io",
    // ── Casino aggregators ──
    "casino.ru", "casinoz.me",
    "slotscatalog.com", "slotozal.com",
    "vulkanstavka.ru",
    "pokerdom.com",
    "ggbet.ru", "ggbet.com",
    "favbet.com", "favbet.ua",
    // ── Betting exchanges ──
    "betfair.com",
    "pinnacle.com",
    "matchbook.com",
  )

  fun init(context: Context) {
    if (initialized) return
    val prefs = getPrefs(context)
    val stored = prefs.getString(KEY_DOMAINS, null)
    cachedDomains = if (stored != null) {
      try {
        val arr = JSONArray(stored)
        val set = mutableSetOf<String>()
        for (i in 0 until arr.length()) {
          set.add(arr.getString(i).lowercase())
        }
        set
      } catch (e: Exception) {
        DEFAULT_DOMAINS
      }
    } else {
      DEFAULT_DOMAINS
    }
    initialized = true
  }

  fun isDomainBlocked(domain: String): Boolean {
    val d = domain.lowercase().trimEnd('.')
    // Exact match
    if (d in cachedDomains) return true
    // Subdomain match — check if any parent domain is blocked
    val parts = d.split('.')
    for (i in 1 until parts.size - 1) {
      val parent = parts.subList(i, parts.size).joinToString(".")
      if (parent in cachedDomains) return true
    }
    return false
  }

  fun updateDomains(context: Context, domains: List<String>) {
    val set = domains.map { it.lowercase().trimEnd('.') }.toSet()
    cachedDomains = set
    val arr = JSONArray()
    set.forEach { arr.put(it) }
    getPrefs(context).edit()
      .putString(KEY_DOMAINS, arr.toString())
      .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
      .apply()
  }

  fun getDomainCount(): Int = cachedDomains.size

  fun getLastUpdated(context: Context): Long {
    return getPrefs(context).getLong(KEY_UPDATED_AT, 0L)
  }

  private fun getPrefs(context: Context): SharedPreferences {
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  }
}
