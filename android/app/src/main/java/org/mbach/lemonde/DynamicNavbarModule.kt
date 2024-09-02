package org.mbach.lemonde

import android.graphics.Color
import android.os.Build
import android.view.Window
import android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
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

    private fun withCurrentWindow(action: (Window) -> Unit) {
        UiThreadUtil.runOnUiThread {
            currentActivity?.window?.let { window ->
                action(window)
            }
        }
    }

    @ReactMethod
    fun setLightNavigationBar(isLight: Boolean) {
        try {
            withCurrentWindow { window ->
                val decorView = window.decorView
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    val controller = decorView.windowInsetsController
                    controller?.setSystemBarsAppearance(
                        if (isLight) APPEARANCE_LIGHT_NAVIGATION_BARS else 0,
                        APPEARANCE_LIGHT_NAVIGATION_BARS
                    )
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val controller = WindowInsetsControllerCompat(window, decorView)
                    controller.isAppearanceLightNavigationBars = isLight
                }

                // Optional: only set color below API 29 or as fallback
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                    window.navigationBarColor = if (isLight) Color.WHITE else Color.BLACK
                }
            }
        } catch (e: Exception) {
            //
        }
    }


    @ReactMethod
    fun setKeepScreenOn(isOn: Boolean) {
        try {
            withCurrentWindow { window ->
                if (isOn) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }
        } catch (e: Exception) {
            //
        }
    }
}
