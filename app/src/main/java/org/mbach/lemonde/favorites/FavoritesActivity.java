package org.mbach.lemonde.favorites;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.snackbar.Snackbar;

import org.mbach.lemonde.Constants;
import org.mbach.lemonde.LeMondeDB;
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;
import org.mbach.lemonde.article.ArticleActivity;
import org.mbach.lemonde.home.RssItem;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * FavoritesActivity class is a place to manage your favorites.
 *
 * @author Matthieu BACHELIER
 * @since 2018-06
 * @version 2.0
 */
public class FavoritesActivity extends AppCompatActivity {
    private final FavoritesAdapter favoritesAdapter = new FavoritesAdapter();
    private List<RssItem> favorites;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ThemeUtils.applyTheme(getBaseContext(), getTheme());
        setContentView(R.layout.activity_favorites);

        final LinearLayoutManager linearLayoutManager = new LinearLayoutManager(this);
        RecyclerView recyclerView = findViewById(R.id.favoritesActivityRecyclerView);
        recyclerView.setLayoutManager(linearLayoutManager);
        recyclerView.setAdapter(favoritesAdapter);
        Toolbar toolbar = findViewById(R.id.toolbarFavorites);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }
        loadFavorites();
    }

    @Override
    public void onRestart() {
        super.onRestart();
        loadFavorites();
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        if (id == android.R.id.home) {
            onBackPressed();
        }
        return true;
    }

    /**
     * Load favorites from DB.
     */
    private void loadFavorites() {
        LeMondeDB leMondeDB = new LeMondeDB(this);
        this.favorites = leMondeDB.getFavorites();
        List<RssItem> items = new ArrayList<>();
        if (favorites.size() == 0) {
            findViewById(R.id.noFavorites).setVisibility(View.VISIBLE);
            Snackbar.make(findViewById(R.id.constraintFavorites), getString(R.string.favorites_none_found), Snackbar.LENGTH_INDEFINITE).show();
        } else {
            Set<Long> dates = new HashSet<>();
            long d;
            for (RssItem f : favorites) {
                d = f.getPubDate();
                // Add an extra item for grouping favorites by date
                if (!dates.contains(d)) {
                    dates.add(d);
                    RssItem favoritesModel = new RssItem(RssItem.DATE_GROUP_TYPE);
                    favoritesModel.setPubDate(d);
                    items.add(favoritesModel);
                }
                items.add(f);
            }
        }
        favoritesAdapter.addItems(items);
    }

    /**
     * Open a saved article.
     *
     * @param view the favorite which was touched
     */
    public void openArticle(@NonNull View view) {
        RssItem fav = null;
        for (RssItem favorite : this.favorites) {
            if (favorite.getLink() != null && favorite.getLink().hashCode() == view.getId()) {
                fav = favorite;
                break;
            }
        }
        if (fav == null) {
            return;
        }
        Intent intent = new Intent(this, ArticleActivity.class);
        Bundle extras = new Bundle();
        extras.putString(Constants.EXTRA_RSS_LINK, fav.getLink());
        extras.putString(Constants.EXTRA_RSS_IMAGE, fav.getMediaContent());
        extras.putString(Constants.EXTRA_RSS_TITLE, fav.getTitle());
        extras.putLong(Constants.EXTRA_RSS_DATE, fav.getPubDate());
        intent.putExtras(extras);
        startActivity(intent);
    }

    /**
     * Delete a favorite.
     *
     * @param view the favorite which was touched
     */
    public void deleteFavorite(@NonNull View view) {
        /*int id = 0;
        View p = (View) view.getParent();
        for (RssItem favorite : this.favorites) {
            if (favorite.getArticleId() == p.getId()) {
                id = favorite.getArticleId();
                break;
            }
        }
        if (id == 0) {
            return;
        }*/
        LeMondeDB leMondeDB = new LeMondeDB(this);
        if (leMondeDB.deleteArticle("")) {
            Snackbar.make(findViewById(R.id.constraintFavorites), getString(R.string.favorites_article_removed), Snackbar.LENGTH_SHORT).show();
            loadFavorites();
        }
    }
}
