package org.mbach.lemonde;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.preference.PreferenceManager;

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

    public static void applyTheme(Context context, Resources.Theme theme) {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        boolean isDark = sharedPreferences.getBoolean("mainTheme", true);
        if (isDark) {
            theme.applyStyle(R.style.DarkTheme, true);
        } else {
            theme.applyStyle(R.style.LightTheme, true);
        }
    }
}
