package expo.modules.vpnfilter

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import org.json.JSONArray

class VpnFilterModule : Module() {

  companion object {
    private const val VPN_REQUEST_CODE = 9001
    private var pendingStartPromise: Promise? = null
  }

  override fun definition() = ModuleDefinition {

    Name("VpnFilter")

    // ── Check if VPN service is currently running ──
    Function("isRunning") {
      VpnFilterService.isRunning
    }

    // ── Get today's blocked count ──
    Function("getBlockedToday") {
      val prefs = getStatsPrefs()
      val savedDate = prefs.getString(VpnFilterService.KEY_BLOCKED_DATE, "")
      val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
        .format(java.util.Date())
      if (savedDate == today) prefs.getInt(VpnFilterService.KEY_BLOCKED_TODAY, 0) else 0
    }

    // ── Get total blocked all time ──
    Function("getTotalBlocked") {
      getStatsPrefs().getLong(VpnFilterService.KEY_TOTAL_BLOCKED, 0L)
    }

    // ── Get recent blocked domains ──
    Function("getRecentBlockedDomains") {
      val prefs = getStatsPrefs()
      val json = prefs.getString(VpnFilterService.KEY_RECENT_DOMAINS, "[]")
      val arr = JSONArray(json ?: "[]")
      val result = mutableListOf<String>()
      for (i in 0 until arr.length()) {
        result.add(arr.getString(i))
      }
      result
    }

    // ── Get current mode: "soft" or "strict" ──
    Function("getMode") {
      getStatsPrefs().getString(VpnFilterService.KEY_MODE, "soft") ?: "soft"
    }

    // ── Set mode ──
    Function("setMode") { mode: String ->
      val prefs = getStatsPrefs()
      prefs.edit()
        .putString(VpnFilterService.KEY_MODE, mode)
        .apply()

      if (mode == "strict") {
        prefs.edit()
          .putLong(VpnFilterService.KEY_STRICT_ACTIVATED_AT, System.currentTimeMillis())
          .apply()
      }
    }

    // ── Check if strict mode can be deactivated ──
    Function("canDeactivateStrict") {
      val prefs = getStatsPrefs()
      val mode = prefs.getString(VpnFilterService.KEY_MODE, "soft")
      if (mode != "strict") return@Function true

      val activatedAt = prefs.getLong(VpnFilterService.KEY_STRICT_ACTIVATED_AT, 0L)
      val elapsed = System.currentTimeMillis() - activatedAt
      val twentyFourHours = 24 * 60 * 60 * 1000L
      elapsed >= twentyFourHours
    }

    // ── Get strict mode remaining time in ms ──
    Function("getStrictRemainingMs") {
      val prefs = getStatsPrefs()
      val activatedAt = prefs.getLong(VpnFilterService.KEY_STRICT_ACTIVATED_AT, 0L)
      if (activatedAt == 0L) return@Function 0L

      val elapsed = System.currentTimeMillis() - activatedAt
      val twentyFourHours = 24 * 60 * 60 * 1000L
      val remaining = twentyFourHours - elapsed
      if (remaining > 0) remaining else 0L
    }

    // ── Get domain count ──
    Function("getDomainCount") {
      DomainBlockList.getDomainCount()
    }

    // ── Update domain blocklist ──
    Function("updateDomains") { domains: List<String> ->
      val ctx = appContext.reactContext ?: return@Function false
      DomainBlockList.updateDomains(ctx, domains)
      true
    }

    // ── Start VPN (async — may require user permission dialog) ──
    AsyncFunction("startVpn") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("ERR_NO_ACTIVITY", "No activity available", null)
        return@AsyncFunction
      }

      val ctx = appContext.reactContext
      if (ctx == null) {
        promise.reject("ERR_NO_CONTEXT", "No context available", null)
        return@AsyncFunction
      }

      // Initialize domain list
      DomainBlockList.init(ctx)

      // Check if VPN permission is needed
      val prepareIntent = VpnService.prepare(ctx)
      if (prepareIntent != null) {
        // Need user approval
        pendingStartPromise = promise
        activity.startActivityForResult(prepareIntent, VPN_REQUEST_CODE)
      } else {
        // Already approved — start service
        startVpnService(ctx)
        promise.resolve(true)
      }
    }

    // ── Stop VPN ──
    Function("stopVpn") {
      val ctx = appContext.reactContext ?: return@Function false

      val mode = getStatsPrefs().getString(VpnFilterService.KEY_MODE, "soft")
      if (mode == "strict") {
        val activatedAt = getStatsPrefs().getLong(VpnFilterService.KEY_STRICT_ACTIVATED_AT, 0L)
        val elapsed = System.currentTimeMillis() - activatedAt
        val twentyFourHours = 24 * 60 * 60 * 1000L
        if (elapsed < twentyFourHours) {
          return@Function false // Cannot stop in strict mode
        }
      }

      val intent = Intent(ctx, VpnFilterService::class.java).apply {
        action = VpnFilterService.ACTION_STOP
      }
      ctx.startService(intent)
      true
    }

    // ── Force stop (with trusted person code) ──
    Function("forceStopVpn") {
      val ctx = appContext.reactContext ?: return@Function false

      // Reset strict mode
      getStatsPrefs().edit()
        .putString(VpnFilterService.KEY_MODE, "soft")
        .remove(VpnFilterService.KEY_STRICT_ACTIVATED_AT)
        .apply()

      val intent = Intent(ctx, VpnFilterService::class.java).apply {
        action = VpnFilterService.ACTION_STOP
      }
      ctx.startService(intent)
      true
    }

    // ── Handle VPN permission result ──
    OnActivityResult { _, payload ->
      if (payload.requestCode == VPN_REQUEST_CODE) {
        val promise = pendingStartPromise
        pendingStartPromise = null

        if (payload.resultCode == Activity.RESULT_OK) {
          val ctx = appContext.reactContext
          if (ctx != null) {
            startVpnService(ctx)
            promise?.resolve(true)
          } else {
            promise?.reject("ERR_NO_CONTEXT", "No context after permission", null)
          }
        } else {
          promise?.reject("ERR_VPN_DENIED", "VPN permission denied by user", null)
        }
      }
    }
  }

  private fun startVpnService(context: Context) {
    val intent = Intent(context, VpnFilterService::class.java).apply {
      action = VpnFilterService.ACTION_START
    }
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      context.startForegroundService(intent)
    } else {
      context.startService(intent)
    }
  }

  private fun getStatsPrefs(): SharedPreferences {
    val ctx = appContext.reactContext
      ?: throw RuntimeException("No context")
    return ctx.getSharedPreferences(VpnFilterService.PREFS_NAME, Context.MODE_PRIVATE)
  }
}
