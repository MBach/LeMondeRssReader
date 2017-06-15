package org.mbach.lemonde.settings;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceActivity;
import android.preference.PreferenceFragment;
import android.preference.PreferenceManager;
import android.support.design.widget.Snackbar;
import android.util.Log;
import android.view.View;

import org.mbach.lemonde.R;

/**
 * SettingsActivity class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class SettingsActivity extends PreferenceActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getBaseContext());
        boolean isDark = sharedPreferences.getBoolean("mainTheme", true);
        if (isDark) {
            getTheme().applyStyle(R.style.DarkTheme, true);
        } else {
            getTheme().applyStyle(R.style.LightTheme, true);
        }
        getFragmentManager().beginTransaction().replace(android.R.id.content, new GeneralPreferenceFragment()).commit();

        PreferenceManager.getDefaultSharedPreferences(this).registerOnSharedPreferenceChangeListener(new SharedPreferences.OnSharedPreferenceChangeListener() {
            @Override
            public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
                Log.d("SettingsActivity", key);
                if ("mainTheme".equals(key)) {
                    View root = SettingsActivity.this.getListView();
                    Snackbar.make(root, getString(R.string.restart_to_apply_theme), Snackbar.LENGTH_LONG)
                            .show();
                }
            }
        });

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
