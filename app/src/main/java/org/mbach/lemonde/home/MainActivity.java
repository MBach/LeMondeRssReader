package org.mbach.lemonde.home;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.design.widget.NavigationView;
import android.support.design.widget.Snackbar;
import android.support.v4.app.ActivityOptionsCompat;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.Toolbar;
import android.util.SparseArray;
import android.util.SparseIntArray;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageView;

import org.mbach.lemonde.Constants;
import org.mbach.lemonde.account.LoginActivity;
import org.mbach.lemonde.settings.SettingsActivity;
import org.mbach.lemonde.R;
import org.mbach.lemonde.article.ArticleActivity;

import java.util.ArrayList;

/**
 * MainActivity class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class MainActivity extends AppCompatActivity implements NavigationView.OnNavigationItemSelectedListener {

    private static final String TAG = "MainActivity";
    private static final int GET_LATEST_RSS_FEED = 0;

    private DrawerLayout drawerLayout;
    private RecyclerView mainActivityRecyclerView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private final RecyclerRssItemAdapter adapter = new RecyclerRssItemAdapter();
    private final SparseArray<String> rssCats = new SparseArray<>();
    private final SparseIntArray colorCats = new SparseIntArray();
    private MenuItem selectedMenuItem;

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
        rssCats.append(R.id.cat_decoders, Constants.CAT_DECODERS);

        colorCats.append(R.id.cat_news, R.color.cat_color_news);
        colorCats.append(R.id.cat_international, R.color.cat_color_international);
        colorCats.append(R.id.cat_politics, R.color.cat_color_politics);
        colorCats.append(R.id.cat_society, R.color.cat_color_society);
        colorCats.append(R.id.cat_economy, R.color.cat_color_economy);
        colorCats.append(R.id.cat_culture, R.color.cat_color_culture);
        colorCats.append(R.id.cat_ideas, R.color.cat_color_ideas);
        colorCats.append(R.id.cat_planet, R.color.cat_color_planet);
        colorCats.append(R.id.cat_sports, R.color.cat_color_sports);
        colorCats.append(R.id.cat_sciences, R.color.cat_color_sciences);
        colorCats.append(R.id.cat_pixels, R.color.cat_color_pixels);
        colorCats.append(R.id.cat_campus, R.color.cat_color_campus);
        colorCats.append(R.id.cat_decoders, R.color.cat_color_decoders);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        initCategories();

        if (isDarkTheme()) {
            getTheme().applyStyle(R.style.DarkTheme, true);
        } else {
            getTheme().applyStyle(R.style.LightTheme, true);
        }

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mainActivityRecyclerView = findViewById(R.id.mainActivityRecyclerView);
        mainActivityRecyclerView.setLayoutManager(new LinearLayoutManager(this));

        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        swipeRefreshLayout.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
            @Override
            public void onRefresh() {
                String category = selectedMenuItem == null ? Constants.CAT_NEWS : rssCats.get(selectedMenuItem.getItemId());
                getFeedFromCategory(category);
            }
        });

        initToolbar();
        setupDrawerLayout();

        mainActivityRecyclerView.setAdapter(adapter);

        setTitle(getString(R.string.category_news));
        getFeedFromCategory(Constants.CAT_NEWS);
    }

    private boolean isDarkTheme() {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getBaseContext());
        return sharedPreferences.getBoolean("mainTheme", true);
    }

    @Override
    public void onEnterAnimationComplete() {
        super.onEnterAnimationComplete();
        mainActivityRecyclerView.scheduleLayoutAnimation();
    }

    /**
     * Initialize the toolbar with a custom icon.
     */
    private void initToolbar() {
        final Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        final ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            if (isDarkTheme()) {
                actionBar.setHomeAsUpIndicator(R.drawable.ic_action_menu);
            } else {
                actionBar.setHomeAsUpIndicator(R.drawable.ic_action_menu_black);
            }
            actionBar.setDisplayHomeAsUpEnabled(true);
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.right_menu_mainactivity, menu);
        return true;
    }

    /**
     * Fetch RSS news from a category by delegating calling and parsing to a dedicated service {@link RssService} in order to keep UI non blocking.
     *
     * @param category the news category to fetch from all available news feeds
     * @see RssService
     */
    private void getFeedFromCategory(final String category) {
        ConnectivityManager cm = (ConnectivityManager) getBaseContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        boolean isConnected = activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        if (isConnected) {
            PendingIntent pendingResult = createPendingResult(GET_LATEST_RSS_FEED, new Intent(), 0);
            Intent intent = new Intent(getApplicationContext(), RssService.class);
            intent.putExtra(RssService.CATEGORY, category);
            intent.putExtra(RssService.PENDING_RESULT, pendingResult);
            startService(intent);
        } else {
            Snackbar.make(findViewById(R.id.drawer_layout), getString(R.string.error_no_connection), Snackbar.LENGTH_INDEFINITE)
                    .setAction(getString(R.string.error_no_connection_retry), new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            getFeedFromCategory(category);
                        }
                    }).show();
        }
        swipeRefreshLayout.setRefreshing(false);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == GET_LATEST_RSS_FEED && resultCode == RssService.FETCH_SUCCESS) {
            ArrayList<RssItem> rssItems = data.getParcelableArrayListExtra(RssService.PARCELABLE_EXTRAS);
            RecyclerRssItemAdapter adapter = new RecyclerRssItemAdapter(rssItems);
            adapter.setOnItemClickListener(new RecyclerRssItemAdapter.OnItemClickListener() {
                @Override
                public void onItemClick(View view, @NonNull RssItem rssItem) {
                    Intent intent = new Intent(MainActivity.this, ArticleActivity.class);
                    Bundle extras = new Bundle();

                    extras.putString(Constants.EXTRA_RSS_LINK, rssItem.getLink());
                    extras.putString(Constants.EXTRA_RSS_IMAGE, rssItem.getEnclosure());

                    ImageView rssImage = view.findViewById(R.id.rss_image);
                    rssImage.buildDrawingCache();
                    extras.putParcelable(Constants.EXTRA_RSS_IMAGE_BITMAP, rssImage.getDrawingCache());
                    intent.putExtras(extras);
                    //startActivity(intent);

                    String transitionName = getString(R.string.transition_open_article);
                    ActivityOptionsCompat options = ActivityOptionsCompat.makeSceneTransitionAnimation(MainActivity.this,
                            rssImage,
                            transitionName);
                    startActivity(intent, options.toBundle());
                }
            });
            mainActivityRecyclerView.setAdapter(adapter);
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem menuItem) {
        selectedMenuItem = menuItem;
        setTitle(menuItem.getTitle());
        String category = rssCats.get(menuItem.getItemId());
        getFeedFromCategory(category);
        drawerLayout.closeDrawers();
        return true;
    }

    /**
     * Initialize the drawer and apply a custom color for every item.
     */
    private void setupDrawerLayout() {
        drawerLayout = findViewById(R.id.drawer_layout);
        NavigationView navigationView = findViewById(R.id.navigation_view);
        navigationView.setItemIconTintList(null);
        navigationView.setNavigationItemSelectedListener(this);
        navigationView.getMenu().getItem(1).setChecked(true);
        View header = navigationView.getHeaderView(0);
        header.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, LoginActivity.class));
                drawerLayout.closeDrawers();
            }
        });
        Menu menu = navigationView.getMenu();
        Drawable icon = getDrawable(R.drawable.circle);
        for (int i = 0; i < menu.size(); i++) {
            MenuItem item = menu.getItem(i);
            int colorId = colorCats.get(item.getItemId());
            if (colorId > 0 && icon != null) {
                // Item must be "cloned" in order to apply a new color, otherwise we're just updating the same object reference
                Drawable.ConstantState constantState = icon.getConstantState();
                if (constantState != null) {
                    Drawable clone = constantState.newDrawable();
                    clone.setColorFilter(getColor(colorId), PorterDuff.Mode.SRC);
                    item.setIcon(clone);
                }
            }
        }
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        switch (item.getItemId()) {
            case R.id.action_account:
                startActivity(new Intent(getApplicationContext(), LoginActivity.class));
                return true;
            case R.id.action_settings:
                startActivity(new Intent(getApplicationContext(), SettingsActivity.class));
                return true;
            case android.R.id.home:
                drawerLayout.openDrawer(GravityCompat.START);
                return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
