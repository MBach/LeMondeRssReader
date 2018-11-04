package org.mbach.lemonde;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.content.res.TypedArray;
import android.preference.PreferenceManager;
import androidx.annotation.NonNull;

/**
 * ThemeUtils class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-06
 */
public final class ThemeUtils {
    public static boolean isDarkTheme(Context context) {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        return sharedPreferences.getBoolean("mainTheme", true);
    }

    public static void applyTheme(Context context, @NonNull Resources.Theme theme) {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        boolean isDark = sharedPreferences.getBoolean("mainTheme", true);
        if (isDark) {
            theme.applyStyle(R.style.DarkTheme, true);
        } else {
            theme.applyStyle(R.style.LightTheme, true);
        }
    }

    public static int getStyleableColor(@NonNull Context context, int resourceId) {
        int theme;
        if (ThemeUtils.isDarkTheme(context)) {
            theme = R.style.DarkTheme;
        } else {
            theme = R.style.LightTheme;
        }
        TypedArray ta = context.obtainStyledAttributes(theme, R.styleable.CustomTheme);
        int styleableColor = ta.getColor(resourceId, 0);
        ta.recycle();
        return styleableColor;
    }
}
