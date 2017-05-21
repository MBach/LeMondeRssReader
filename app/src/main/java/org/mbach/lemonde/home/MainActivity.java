package org.mbach.lemonde.home;

import android.content.Intent;
import android.os.Bundle;
import android.os.StrictMode;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.design.widget.NavigationView;
import android.support.design.widget.Snackbar;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.util.SparseArray;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;

import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;
import org.mbach.lemonde.settings.SettingsActivity;
import org.mbach.lemonde.article.ArticleActivity;
import org.xmlpull.v1.XmlPullParserException;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;

public class MainActivity extends AppCompatActivity implements NavigationView.OnNavigationItemSelectedListener {

    private static final String TAG = "MainActivity";

    private final LeMondeRssParser parser = new LeMondeRssParser();
    private DrawerLayout drawerLayout;
    private View content;
    private RecyclerView mainActivityRecyclerView;
    private final RecyclerRssItemAdapter adapter = new RecyclerRssItemAdapter();

    private final SparseArray<String> rssCats = new SparseArray<>();

    private void initCategories() {
        rssCats.append(R.id.cat_news, Constants.CAT_NEWS);
        rssCats.append(R.id.cat_international, Constants.CAT_INTERNATIONAL);
        rssCats.append(R.id.cat_politics, Constants.CAT_POLITICS);
        rssCats.append(R.id.cat_society, Constants.CAT_SOCIETY);
        rssCats.append(R.id.cat_economy, Constants.CAT_ECONOMY);
        rssCats.append(R.id.cat_culture, Constants.CAT_CULTURE);
        rssCats.append(R.id.cat_ideas, Constants.CAT_IDEAS);
        rssCats.append(R.id.cat_planet, Constants.CAT_PLANET);
        rssCats.append(R.id.cat_sports, Constants.CAT_SPORTS);
        rssCats.append(R.id.cat_sciences, Constants.CAT_SCIENCES);
        rssCats.append(R.id.cat_pixels, Constants.CAT_PIXELS);
        rssCats.append(R.id.cat_campus, Constants.CAT_CAMPUS);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        initCategories();
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mainActivityRecyclerView = (RecyclerView) findViewById(R.id.mainActivityRecyclerView);
        mainActivityRecyclerView.setLayoutManager(new LinearLayoutManager(this));

        initFab();
        initToolbar();
        setupDrawerLayout();

        content = findViewById(R.id.content);
        mainActivityRecyclerView.setAdapter(adapter);

        getFeedFromCategory(Constants.CAT_NEWS);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy");
    }

    @Override
    public void onEnterAnimationComplete() {
        super.onEnterAnimationComplete();
        mainActivityRecyclerView.scheduleLayoutAnimation();
    }

    private void initFab() {
        findViewById(R.id.fab).setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                Snackbar.make(content, "FAB Clicked", Snackbar.LENGTH_SHORT).show();
            }
        });
    }

    private void initToolbar() {
        final Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        final ActionBar actionBar = getSupportActionBar();

        if (actionBar != null) {
            actionBar.setHomeAsUpIndicator(R.drawable.ic_menu_white_24dp);
            actionBar.setDisplayHomeAsUpEnabled(true);
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.right_menu_mainactivity, menu);
        return true;
    }

    public void getFeedFromCategory(String category) {
        try {
            List<RssItem> rssItems = parser.parse(getInputStream(category));
            RecyclerRssItemAdapter adapter = new RecyclerRssItemAdapter(rssItems);
            adapter.setOnItemClickListener(new RecyclerRssItemAdapter.OnItemClickListener() {
                @Override
                public void onItemClick(View view, @NonNull RssItem rssItem) {
                    Intent intent = new Intent(MainActivity.this, ArticleActivity.class);
                    intent.putExtra(Constants.EXTRA_RSS_LINK, rssItem.getLink());
                    intent.putExtra(Constants.EXTRA_RSS_IMAGE, rssItem.getEnclosure());
                    intent.putExtra(Constants.EXTRA_RSS_DESCRIPTION, rssItem.getDescription());
                    startActivityForResult(intent, 1001);
                }
            });
            mainActivityRecyclerView.setAdapter(adapter);
        } catch (@NonNull XmlPullParserException | IOException e) {
            Log.w(e.getMessage(), e);
        }
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem menuItem) {
        setTitle(menuItem.getTitle());
        String category = rssCats.get(menuItem.getItemId());
        getFeedFromCategory(category);
        drawerLayout.closeDrawers();
        return true;
    }

    private void setupDrawerLayout() {
        drawerLayout = (DrawerLayout) findViewById(R.id.drawer_layout);
        NavigationView navigationView = (NavigationView) findViewById(R.id.navigation_view);
        navigationView.setNavigationItemSelectedListener(this);
        navigationView.getMenu().getItem(1).setChecked(true);
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        switch (item.getItemId()) {
            case R.id.action_settings:
                Intent intent = new Intent(getApplicationContext(), SettingsActivity.class);
                startActivity(intent);
                return true;
            case android.R.id.home:
                drawerLayout.openDrawer(GravityCompat.START);
                return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Nullable
    public InputStream getInputStream(String category) {
        try {
            URL url = new URL(Constants.BASE_URL + category);
            URLConnection urlConnection = url.openConnection();
            urlConnection.setUseCaches(true);

            //long currentTime = System.currentTimeMillis();
            //long expires = urlConnection.getHeaderFieldDate("Expires", currentTime);
            //long lastModified = urlConnection.getHeaderFieldDate("Last-Modified", currentTime);

            String cacheControl = urlConnection.getHeaderField("Cache-Control");
            Log.d(TAG, "Cache-Control flag: " + cacheControl);
            Log.d(TAG, "Last-Modified flag: " + urlConnection.getLastModified());
            return urlConnection.getInputStream();
        } catch (IOException e) {
            Log.w(Constants.TAG, "Exception while retrieving the input stream", e);
            return null;
        }
    }
}
