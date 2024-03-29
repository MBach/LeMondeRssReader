package org.mbach.lemonde;

import android.graphics.Color;
import android.os.Build;
import androidx.annotation.NonNull;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

/**
 * @author Matthieu BACHELIER
 * @version 1.0
 * @since 2020-04
 */
public class DynamicNavbarModule extends ReactContextBaseJavaModule {

    DynamicNavbarModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    public String getName() {
        return "DynamicNavbarModule";
    }

    @ReactMethod
    public void setLightNavigationBar(final boolean isLight) {
            try {
                UiThreadUtil.runOnUiThread(() -> {
                    if (getCurrentActivity() == null) {
                        return;
                    }
                    Window window = getCurrentActivity().getWindow();
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        int flags = window.getDecorView().getSystemUiVisibility();
                        if (isLight) {
                            flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        } else {
                            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        }
                        window.getDecorView().setSystemUiVisibility(flags);
                    }
                    window.setNavigationBarColor(Color.parseColor(isLight ? "#FFFFFF" : "#000000"));
                });
            } catch (Exception e) {
                //
            }
    }

    @ReactMethod
    public void setKeepScreenOn(final boolean isOn) {
        try {
            UiThreadUtil.runOnUiThread(() -> {
                if (getCurrentActivity() == null) {
                    return;
                }
                if (getCurrentActivity().getWindow() != null) {
                    if (isOn) {
                        getCurrentActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    } else {
                        getCurrentActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    }
                }
            });
        } catch (Exception e) {
            //
        }
    }
}
