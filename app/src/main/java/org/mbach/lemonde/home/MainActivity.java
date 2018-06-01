package org.mbach.lemonde.home;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.Icon;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.RequiresApi;
import android.support.design.widget.NavigationView;
import android.support.design.widget.Snackbar;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.ActivityOptionsCompat;
import android.support.v4.content.ContextCompat;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.AppCompatImageView;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.Toolbar;
import android.util.SparseArray;
import android.util.SparseIntArray;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;

import org.mbach.lemonde.Constants;
import org.mbach.lemonde.LeMondeDB;
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;
import org.mbach.lemonde.account.LoginActivity;
import org.mbach.lemonde.article.ArticleActivity;
import org.mbach.lemonde.settings.SettingsActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * MainActivity class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class MainActivity extends AppCompatActivity implements NavigationView.OnNavigationItemSelectedListener {

    private static final int GET_LATEST_RSS_FEED = 0;
    private static final int FROM_SETTINGS_ACTIVITY = 1;

    private DrawerLayout drawerLayout;
    private RecyclerView mainActivityRecyclerView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private final RecyclerRssItemAdapter adapter = new RecyclerRssItemAdapter();
    private final SparseArray<String> rssCats = new SparseArray<>();
    private final SparseIntArray colorCats = new SparseIntArray();
    private MenuItem selectedMenuItem;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ThemeUtils.applyTheme(getBaseContext(), getTheme());
        initCategories();
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
        Bundle bundle = getIntent().getExtras();
        if (bundle == null) {
            setTitle(getString(R.string.category_news));
            getFeedFromCategory(Constants.CAT_NEWS);
        } else {
            int category = getIntent().getIntExtra(Constants.EXTRA_NEWS_CATEGORY, -1);
            if (category > 0) {
                setTitle(getIntent().getStringExtra(Constants.EXTRA_TITLE_CATEGORY));
                getFeedFromCategory(rssCats.get(category));
            } else {
                setTitle(getString(R.string.category_news));
                getFeedFromCategory(Constants.CAT_NEWS);
            }
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (android.os.Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
            setDynamicShortcuts();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.mainactivity_right_menu, menu);
        return true;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @NonNull Intent data) {
        if (requestCode == GET_LATEST_RSS_FEED && resultCode == RssService.FETCH_SUCCESS) {
            ArrayList<RssItem> rssItems = data.getParcelableArrayListExtra(RssService.PARCELABLE_EXTRAS);
            RecyclerRssItemAdapter adapter = new RecyclerRssItemAdapter(rssItems);
            adapter.setOnItemClickListener(new RecyclerRssItemAdapter.OnItemClickListener() {
                @Override
                public void onItemClick(@NonNull View view, @NonNull RssItem rssItem) {
                    Intent intent = new Intent(MainActivity.this, ArticleActivity.class);
                    Bundle extras = new Bundle();

                    extras.putInt(Constants.EXTRA_RSS_ARTICLE_ID, rssItem.getArticleId());
                    extras.putString(Constants.EXTRA_RSS_LINK, rssItem.getLink());
                    extras.putString(Constants.EXTRA_RSS_IMAGE, rssItem.getEnclosure());

                    AppCompatImageView rssImage = view.findViewById(R.id.rss_image);
                    intent.putExtras(extras);

                    if (android.os.Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        ActivityOptionsCompat options = ActivityOptionsCompat.makeSceneTransitionAnimation(MainActivity.this,
                                rssImage,
                                getString(R.string.transition_open_article));
                        ActivityCompat.startActivity(MainActivity.this, intent, options.toBundle());
                    } else {
                        startActivity(intent);
                    }
                }
            });
            mainActivityRecyclerView.setAdapter(adapter);
        } else if (requestCode == FROM_SETTINGS_ACTIVITY && resultCode == Constants.THEME_CHANGED) {
            recreate();
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

        if (android.os.Build.VERSION.SDK_INT > Build.VERSION_CODES.N) {
            // Save the category that has been selected by one, in order to create dynamic shortcuts.
            // It's based on how often this category is selected: the most selected in placed at the bottom on a long touch event
            // The 4th most selected is placed at the top
            LeMondeDB leMondeDB = new LeMondeDB(this);
            leMondeDB.saveSelectedEntry(menuItem.getItemId());
        }
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        switch (item.getItemId()) {
            case R.id.action_account:
                startActivity(new Intent(getApplicationContext(), LoginActivity.class));
                return true;
            case R.id.action_settings:
                startActivityForResult(new Intent(getApplicationContext(), SettingsActivity.class), FROM_SETTINGS_ACTIVITY);
                return true;
            case android.R.id.home:
                drawerLayout.openDrawer(GravityCompat.START);
                return true;
        }
        return super.onOptionsItemSelected(item);
    }

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
        rssCats.append(R.id.cat_videos, Constants.CAT_VIDEOS);

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
        colorCats.append(R.id.cat_videos, R.color.cat_color_videos);
    }

    /**
     * Initialize the toolbar with a custom icon.
     */
    private void initToolbar() {
        final Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        final ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setDisplayHomeAsUpEnabled(true);
            actionBar.setHomeButtonEnabled(true);
        }
    }

    /**
     *
     */
    @RequiresApi(Build.VERSION_CODES.N_MR1)
    private void setDynamicShortcuts() {
        List<ShortcutInfo> dynamicShortcuts = new ArrayList<>();

        NavigationView navigationView = findViewById(R.id.navigation_view);
        Menu menu = navigationView.getMenu();

        final SparseIntArray iconCats = new SparseIntArray();
        iconCats.append(R.id.cat_news, R.drawable.ic_mic_black_48dp);
        iconCats.append(R.id.cat_international, R.drawable.ic_language_white_48dp);
        iconCats.append(R.id.cat_politics, R.drawable.ic_tie_white_48dp);
        iconCats.append(R.id.cat_society, R.drawable.ic_location_city_white_48dp);
        iconCats.append(R.id.cat_economy, R.drawable.ic_trending_up_white_48dp);
        iconCats.append(R.id.cat_culture, R.drawable.ic_color_lens_white_48dp);
        iconCats.append(R.id.cat_ideas, R.drawable.ic_lightbulb_outline_white_48dp);
        iconCats.append(R.id.cat_planet, R.drawable.ic_landscape_white_48dp);
        iconCats.append(R.id.cat_sports, R.drawable.ic_pool_white_48dp);
        iconCats.append(R.id.cat_sciences, R.drawable.ic_colorize_white_48dp);
        iconCats.append(R.id.cat_pixels, R.drawable.ic_videogame_asset_white_48dp);
        iconCats.append(R.id.cat_campus, R.drawable.ic_school_white_48dp);
        iconCats.append(R.id.cat_decoders, R.drawable.ic_vpn_key_white_48dp);

        // A colored icon will be generated for every dynamic shortcut
        Drawable drawable = getDrawable(R.drawable.circle);
        Bitmap.Config conf = Bitmap.Config.ARGB_8888;
        for (Integer entry : new LeMondeDB(this).getSavedEntries()) {
            for (int i = 0; i < menu.size(); i++) {
                MenuItem menuItem = menu.getItem(i);
                if (menuItem.getItemId() == entry) {
                    Intent intent = new Intent(Intent.ACTION_MAIN, Uri.EMPTY, this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    intent.putExtra(Constants.EXTRA_NEWS_CATEGORY, menuItem.getItemId());
                    intent.putExtra(Constants.EXTRA_TITLE_CATEGORY, menuItem.getTitle());
                    intent.putExtra(Constants.EXTRA_INDEX_CATEGORY, i);

                    ShortcutInfo.Builder shortcut = new ShortcutInfo.Builder(this, entry + "_shortcut")
                            .setShortLabel(menuItem.getTitleCondensed())
                            .setLongLabel(menuItem.getTitle())
                            .setIntent(intent);

                    int colorId = colorCats.get(entry);
                    if (colorId > 0 && drawable != null) {
                        Bitmap result = Bitmap.createBitmap(192, 192, conf);
                        Canvas canvas = new Canvas(result);
                        Paint paint = new Paint();
                        paint.setColor(getColor(colorId));
                        paint.setStyle(Paint.Style.FILL);
                        canvas.drawCircle(96, 96, 96, paint);

                        // Check if an icon exists for this category
                        if (iconCats.get(entry) > 0) {
                            Drawable drawableTmp = getDrawable(iconCats.get(entry));
                            BitmapDrawable bitmapDrawable = ((BitmapDrawable) drawableTmp);
                            if (bitmapDrawable != null) {
                                Bitmap icon = bitmapDrawable.getBitmap();
                                canvas.drawBitmap(icon, 24, 24, null);
                            }
                        }
                        shortcut.setIcon(Icon.createWithBitmap(result));
                    }
                    dynamicShortcuts.add(shortcut.build());
                    break;
                }
            }
        }
        ShortcutManager shortcutManager = getSystemService(ShortcutManager.class);
        if (shortcutManager != null && !dynamicShortcuts.isEmpty()) {
            shortcutManager.setDynamicShortcuts(dynamicShortcuts);
        }
    }

    /**
     * Fetch RSS news from a category by delegating calling and parsing to a dedicated service {@link RssService} in order to keep UI non blocking.
     *
     * @param category the news category to fetch from all available news feeds
     * @see RssService
     */
    private void getFeedFromCategory(final String category) {
        ConnectivityManager cm = (ConnectivityManager) getBaseContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) {
            return;
        }
        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        boolean isConnected = activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        //if (isConnected) {
        PendingIntent pendingResult = createPendingResult(GET_LATEST_RSS_FEED, new Intent(), 0);
        Intent intent = new Intent(getApplicationContext(), RssService.class);
        intent.putExtra(RssService.CATEGORY, category);
        intent.putExtra(RssService.PENDING_RESULT, pendingResult);
        startService(intent);
        //} else {
        if (!isConnected) {
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

    /**
     * Initialize the drawer and apply a custom color for every item.
     */
    private void setupDrawerLayout() {
        drawerLayout = findViewById(R.id.drawer_layout);
        NavigationView navigationView = findViewById(R.id.navigation_view);
        navigationView.setItemIconTintList(null);
        navigationView.setNavigationItemSelectedListener(this);
        View header = navigationView.getHeaderView(0);
        header.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, LoginActivity.class));
                drawerLayout.closeDrawers();
            }
        });

        final Toolbar toolbar = findViewById(R.id.toolbar);
        ActionBarDrawerToggle actionBarDrawerToggle = new ActionBarDrawerToggle(
                this, drawerLayout, toolbar,
                R.string.navigation_drawer_open, R.string.navigation_drawer_close
        );
        drawerLayout.addDrawerListener(actionBarDrawerToggle);
        actionBarDrawerToggle.syncState();

        Drawable icon;
        if (android.os.Build.VERSION.SDK_INT > Build.VERSION_CODES.LOLLIPOP) {
            icon = getDrawable(R.drawable.circle);
        } else {
            icon = getResources().getDrawable(R.drawable.circle);
        }
        Menu menu = navigationView.getMenu();
        if (getIntent().getExtras() == null) {
            menu.getItem(1).setChecked(true);
        } else {
            int index = getIntent().getExtras().getInt(Constants.EXTRA_INDEX_CATEGORY, 1);
            menu.getItem(index).setChecked(true);
        }
        for (int i = 0; i < menu.size(); i++) {
            MenuItem item = menu.getItem(i);
            int colorId = colorCats.get(item.getItemId());
            if (colorId > 0 && icon != null) {
                // Item must be "cloned" in order to apply a new color, otherwise we're just updating the same object reference
                Drawable.ConstantState constantState = icon.getConstantState();
                if (constantState != null) {
                    Drawable clone = constantState.newDrawable();
                    int color = ContextCompat.getColor(getBaseContext(), colorId);
                    if (colorId == R.color.cat_color_news && ThemeUtils.isDarkTheme(getBaseContext())) {
                        color = ContextCompat.getColor(getBaseContext(), R.color.cat_color_news_dark);
                    }
                    clone.setColorFilter(color, PorterDuff.Mode.SRC);
                    item.setIcon(clone);
                }
            }
        }
    }
}
