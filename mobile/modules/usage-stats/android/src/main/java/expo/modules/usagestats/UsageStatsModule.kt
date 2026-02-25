package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class UsageStatsModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is null")

  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    // Check if USAGE_STATS permission is granted
    Function("hasPermission") {
      hasUsageStatsPermission()
    }

    // Open Android Usage Access Settings
    Function("openUsageAccessSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    // Get recently used apps in the last N minutes
    AsyncFunction("getRecentApps") { minutes: Int ->
      if (!hasUsageStatsPermission()) {
        return@AsyncFunction emptyList<Map<String, Any>>()
      }

      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val endTime = System.currentTimeMillis()
      val startTime = endTime - (minutes * 60 * 1000L)

      val stats = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_BEST,
        startTime,
        endTime
      )

      stats
        ?.filter { it.totalTimeInForeground > 0 }
        ?.sortedByDescending { it.lastTimeUsed }
        ?.map { stat ->
          val appName = try {
            val appInfo = context.packageManager.getApplicationInfo(stat.packageName, 0)
            context.packageManager.getApplicationLabel(appInfo).toString()
          } catch (e: PackageManager.NameNotFoundException) {
            stat.packageName
          }

          mapOf(
            "packageName" to stat.packageName,
            "appName" to appName,
            "lastTimeUsed" to stat.lastTimeUsed,
            "totalTimeInForeground" to stat.totalTimeInForeground
          )
        }
        ?: emptyList()
    }

    // Check specifically for gambling apps in last N minutes
    AsyncFunction("checkGamblingApps") { minutes: Int, gamblingPackages: List<String> ->
      if (!hasUsageStatsPermission()) {
        return@AsyncFunction emptyList<Map<String, Any>>()
      }

      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val endTime = System.currentTimeMillis()
      val startTime = endTime - (minutes * 60 * 1000L)

      val stats = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_BEST,
        startTime,
        endTime
      )

      stats
        ?.filter { stat ->
          stat.totalTimeInForeground > 0 &&
          gamblingPackages.any { pkg ->
            stat.packageName.contains(pkg, ignoreCase = true)
          }
        }
        ?.sortedByDescending { it.lastTimeUsed }
        ?.map { stat ->
          val appName = try {
            val appInfo = context.packageManager.getApplicationInfo(stat.packageName, 0)
            context.packageManager.getApplicationLabel(appInfo).toString()
          } catch (e: PackageManager.NameNotFoundException) {
            stat.packageName
          }

          mapOf(
            "packageName" to stat.packageName,
            "appName" to appName,
            "lastTimeUsed" to stat.lastTimeUsed,
            "totalTimeInForeground" to stat.totalTimeInForeground
          )
        }
        ?: emptyList()
    }
  }

  private fun hasUsageStatsPermission(): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      Process.myUid(),
      context.packageName
    )
    return mode == AppOpsManager.MODE_ALLOWED
  }
}
