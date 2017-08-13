package org.mbach.lemonde.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceActivity;
import android.preference.PreferenceFragment;
import android.preference.PreferenceManager;

import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;

/**
 * SettingsActivity class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class SettingsActivity extends PreferenceActivity {

    private static boolean themeHasChanged;

    private final SharedPreferences.OnSharedPreferenceChangeListener prefChangeListener = new SharedPreferences.OnSharedPreferenceChangeListener() {
        @Override
        public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
            if ("mainTheme".equals(key)) {
                themeHasChanged = true;
                PreferenceManager.getDefaultSharedPreferences(SettingsActivity.this).unregisterOnSharedPreferenceChangeListener(prefChangeListener);
                recreate();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        ThemeUtils.applyTheme(getBaseContext(), getTheme());
        super.onCreate(savedInstanceState);
        getFragmentManager().beginTransaction().replace(android.R.id.content, new GeneralPreferenceFragment()).commit();
        PreferenceManager.getDefaultSharedPreferences(this).registerOnSharedPreferenceChangeListener(prefChangeListener);
    }

    @Override
    public void onBackPressed() {
        Intent intent = new Intent();
        setResult(themeHasChanged ? Constants.THEME_CHANGED : 0, intent);
        themeHasChanged = false;
        finish();
    }

    @Override
    protected boolean isValidFragment(String fragmentName) {
        return GeneralPreferenceFragment.class.getName().equals(fragmentName);
    }

    public static class GeneralPreferenceFragment extends PreferenceFragment {
        @Override
        public void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            addPreferencesFromResource(R.xml.settings);
        }
    }
}
