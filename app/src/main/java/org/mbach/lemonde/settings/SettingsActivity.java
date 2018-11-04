package org.mbach.lemonde.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceFragment;
import android.preference.PreferenceManager;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;

/**
 * SettingsActivity class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class SettingsActivity extends AppCompatActivity {

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
        super.onCreate(savedInstanceState);
        ThemeUtils.applyTheme(getBaseContext(), getTheme());
        setContentView(R.layout.activity_settings);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        getFragmentManager().beginTransaction().replace(R.id.pref_content, new GeneralPreferenceFragment()).commit();
        PreferenceManager.getDefaultSharedPreferences(this).registerOnSharedPreferenceChangeListener(prefChangeListener);
    }

    @Override
    public void onBackPressed() {
        Intent intent = new Intent();
        setResult(themeHasChanged ? Constants.THEME_CHANGED : 0, intent);
        themeHasChanged = false;
        finish();
    }

    public static class GeneralPreferenceFragment extends PreferenceFragment {
        @Override
        public void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            addPreferencesFromResource(R.xml.settings);
        }
    }
}
