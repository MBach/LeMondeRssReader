package org.mbach.lemonde;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.provider.BaseColumns;
import android.support.annotation.NonNull;
import android.util.Log;

import org.mbach.lemonde.home.RssItem;

import java.util.ArrayList;
import java.util.List;

/**
 * LeMondeDB class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-07
 */
public class LeMondeDB {
    private SQLiteDatabase sqLiteDatabase;
    private static final int DB_VERSION = 1;
    private final LeMondeSQLiteOpenHelper statisticSQLiteOpenHelper;

    private static final String DB_NAME = "lemonde.db";

    /**
     * StatEntry inner class.
     */
    static class StatEntry implements BaseColumns {
        static final String TABLE = "table_stats";
        static final String COL_CATEGORY = "CATEGORY";
        static final String COL_TIMES_OPENED = "TIMES_OPENED";
        static final String COL_LAST_OPENED = "LAST_OPENED";
        static final String CREATE_TABLE = "CREATE TABLE " + TABLE + " ("
                + COL_CATEGORY + " INTEGER PRIMARY KEY, "
                + COL_TIMES_OPENED + " INTEGER NOT NULL, "
                + COL_LAST_OPENED + " INTEGER NOT NULL);";
    }

    /**
     * FavEntry inner class.
     */
    static class FavEntry implements BaseColumns {
        static final String TABLE = "table_fav";
        static final String COL_CATEGORY = "CATEGORY";
        static final String COL_TITLE = "TITLE";
        static final String COL_LINK = "LINK";
        static final String COL_ENCLOSURE = "ENCLOSURE";
        static final String COL_DATE = "DATE";
        static final String CREATE_TABLE = "CREATE TABLE " + TABLE + " ("
                + _ID + " INTEGER PRIMARY KEY, "
                + COL_CATEGORY + " TEXT, "
                + COL_TITLE + " TEXT NOT NULL, "
                + COL_LINK + " TEXT NOT NULL, "
                + COL_ENCLOSURE + " TEXT NOT NULL, "
                + COL_DATE + " INTEGER NOT NULL);";
    }

    /**
     *
     * @param context the context
     */
    public LeMondeDB(Context context) {
        statisticSQLiteOpenHelper = new LeMondeSQLiteOpenHelper(context, DB_NAME, null, DB_VERSION);
    }

    private void open() {
        sqLiteDatabase = statisticSQLiteOpenHelper.getWritableDatabase();
    }

    private void close() {
        sqLiteDatabase.close();
    }

    // STATISTICS ON MENU

    /**
     *
     * @param categoryId category to save
     */
    public void saveSelectedEntry(int categoryId) {
        open();
        String cat = String.valueOf(categoryId);
        // Check if row exists first
        Cursor catWasSavedOnce = sqLiteDatabase.query(StatEntry.TABLE,
                new String[]{StatEntry.COL_TIMES_OPENED}, StatEntry.COL_CATEGORY + " = ?",
                new String[]{cat}, null, null, null);
        ContentValues values = new ContentValues();
        values.put(StatEntry.COL_LAST_OPENED, System.currentTimeMillis());
        values.put(StatEntry.COL_CATEGORY, categoryId);
        if (catWasSavedOnce.getCount() == 0) {
            // First time we're accessing this category
            values.put(StatEntry.COL_TIMES_OPENED, 0);
            sqLiteDatabase.insert(StatEntry.TABLE, null, values);
        } else {
            // Category was accessed N times
            catWasSavedOnce.moveToFirst();
            values.put(StatEntry.COL_TIMES_OPENED, catWasSavedOnce.getInt(0) + 1);
            sqLiteDatabase.update(StatEntry.TABLE, values, StatEntry.COL_CATEGORY + " = ?", new String[]{cat});
        }
        catWasSavedOnce.close();
        close();
    }


    /**
     *
     * @return list of integers
     */
    @NonNull
    public List<Integer> getSavedEntries() {
        open();
        Cursor entries = sqLiteDatabase.query(StatEntry.TABLE,
                new String[]{StatEntry.COL_CATEGORY},
                StatEntry.COL_CATEGORY,
                null, null, null,
                StatEntry.COL_TIMES_OPENED + " DESC, " + StatEntry.COL_LAST_OPENED + " DESC", "4");
        List<Integer> results = new ArrayList<>();
        if (entries.getCount() != 0) {
            while (entries.moveToNext()) {
                int cat = entries.getInt(0);
                results.add(cat);
            }
        }
        entries.close();
        close();
        return results;
    }

    // MANAGE FAVORITES

    /**
     * Check if article was saved.
     *
     * @param articleId article to search
     * @return true if article was found
     */
    public boolean hasArticle(int articleId) {
        open();
        Cursor entry = sqLiteDatabase.query(FavEntry.TABLE,
                new String[] { FavEntry._ID },
                FavEntry._ID + " = ?",
                new String[] { String.valueOf(articleId) }, null,null, null);
        long id = 0;
        if (entry.getCount() > 0) {
            entry.moveToFirst();
            id = entry.getLong(0);
        }
        entry.close();
        close();
        return id == articleId;
    }

    /**
     * Save an article.
     *
     * @param favorite article to save
     * @return true if successfully saved
     */
    public boolean saveArticle(RssItem favorite) {
        if (favorite.getArticleId() <= 0) {
            return false;
        }
        open();
        ContentValues values = new ContentValues();
        values.put(FavEntry._ID, favorite.getArticleId());
        values.put(FavEntry.COL_TITLE, favorite.getTitle());
        values.put(FavEntry.COL_CATEGORY, favorite.getCategory());
        values.put(FavEntry.COL_LINK, favorite.getLink());
        values.put(FavEntry.COL_ENCLOSURE, favorite.getEnclosure());
        values.put(FavEntry.COL_DATE, favorite.getPubDate());
        long id = sqLiteDatabase.insert(FavEntry.TABLE, null, values);
        close();
        return id != -1;
    }

    /**
     * Delete a favorite.
     *
     * @param articleId article to remove from favorites
     * @return true if deleted
     */
    public boolean deleteArticle(int articleId) {
        if (articleId <= 0) {
            return false;
        }
        open();
        String selection = FavEntry._ID + " = ?";
        String[] selectionArgs = { String.valueOf(articleId) };
        long count = sqLiteDatabase.delete(FavEntry.TABLE, selection, selectionArgs);
        close();
        return count > 0;
    }

    /**
     * Load all favorites.
     *
     * @return list of favorites
     */
    public List<RssItem> getFavorites() {
        open();
        Cursor entries = sqLiteDatabase.query(FavEntry.TABLE,
                new String[]{FavEntry._ID, FavEntry.COL_TITLE, FavEntry.COL_CATEGORY, FavEntry.COL_LINK, FavEntry.COL_ENCLOSURE, FavEntry.COL_DATE},
                null,null, null, null, FavEntry.COL_DATE + " DESC", null);
        List<RssItem> results = new ArrayList<>();
        if (entries.getCount() != 0) {
            while (entries.moveToNext()) {
                int i = -1;
                RssItem favorite = new RssItem(RssItem.ARTICLE_TYPE);
                favorite.setArticleId(entries.getInt(++i));
                favorite.setTitle(entries.getString(++i));
                favorite.setCategory(entries.getString(++i));
                favorite.setLink(entries.getString(++i));
                favorite.setEnclosure(entries.getString(++i));
                favorite.setPubDate(entries.getLong(++i));
                results.add(favorite);
                Log.d("LeMondeDB", "id = " + favorite.getArticleId());
            }
        }
        entries.close();
        close();
        return results;
    }
}
