package org.mbach.lemonde

import android.graphics.Color
import android.os.Build
import android.view.WindowManager
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * @author Matthieu BACHELIER
 * @version 1.0
 * @since 2020-04
 */
class DynamicNavbarModule internal constructor(reactContext: ReactApplicationContext?) :
    ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "DynamicNavbarModule"
    }

    @ReactMethod
    fun setLightNavigationBar(isLight: Boolean) {
        try {
            UiThreadUtil.runOnUiThread {
                currentActivity?.let { activity ->
                    val window = activity.window
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        val controller = WindowInsetsControllerCompat(window, window.decorView)
                        controller.isAppearanceLightNavigationBars = isLight
                    }
                    val color = if (isLight) Color.WHITE else Color.BLACK
                    window.navigationBarColor = color
                }
            }
        } catch (e: Exception) {
            //
        }
    }

    @ReactMethod
    fun setKeepScreenOn(isOn: Boolean) {
        try {
            UiThreadUtil.runOnUiThread {
                if (currentActivity == null) {
                    return@runOnUiThread
                }
                if (currentActivity!!.window != null) {
                    if (isOn) {
                        currentActivity!!.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    } else {
                        currentActivity!!.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    }
                }
            }
        } catch (e: Exception) {
            //
        }
    }
}
