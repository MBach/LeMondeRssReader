package org.mbach.lemonde;

import android.os.Build;
import androidx.annotation.NonNull;
import android.view.View;
import android.view.Window;

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

    private static final String TAG = "DynamicNavbarModule";

    DynamicNavbarModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    public String getName() {
        return "DynamicNavbarModule";
    }

    @ReactMethod
    public void setLightNavigationBar(final boolean isLight) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                UiThreadUtil.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (getCurrentActivity() == null) {
                            return;
                        }
                        Window window = getCurrentActivity().getWindow();
                        int mUIFlags = window.getDecorView().getSystemUiVisibility();
                        if (isLight) {
                            mUIFlags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        } else {
                            mUIFlags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        }
                        window.getDecorView().setSystemUiVisibility(mUIFlags);
                        // promise.resolve(true);
                    }
                });
            } catch (Exception e) {
                // promise.reject(e);
            }
        }
    }
}
