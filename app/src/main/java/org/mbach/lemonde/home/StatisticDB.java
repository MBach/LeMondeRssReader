package org.mbach.lemonde.home;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

/**
 * StatisticDB class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-07
 */
class StatisticDB {
    private static final String TAG = "StatisticDB";

    private SQLiteDatabase sqLiteDatabase;
    private static final int DB_VERSION = 1;
    private StatisticSQLiteOpenHelper statisticSQLiteOpenHelper;

    private static final String DB_NAME = "stats.db";

    StatisticDB(Context context){
        statisticSQLiteOpenHelper = new StatisticSQLiteOpenHelper(context, DB_NAME, null, DB_VERSION);
    }

    private void open(){
        sqLiteDatabase = statisticSQLiteOpenHelper.getWritableDatabase();
    }

    private void close(){
        sqLiteDatabase.close();
    }

    void saveSelectedEntry(int categoryId){
        open();
        // Check if row exists first
        Cursor catWasSavedOnce = sqLiteDatabase.query(StatisticSQLiteOpenHelper.TABLE_STATS,
                new String[] { StatisticSQLiteOpenHelper.COL_TIMES_OPENED }, StatisticSQLiteOpenHelper.COL_CATEGORY + " = ?",
                new String[]{ String.valueOf(categoryId) },
                null,
                null,
                null);
        ContentValues values = new ContentValues();
        values.put(StatisticSQLiteOpenHelper.COL_LAST_OPENED, System.currentTimeMillis());
        values.put(StatisticSQLiteOpenHelper.COL_CATEGORY, categoryId);
        if (catWasSavedOnce.getCount() == 0) {
            Log.d(TAG, "First time we're accessing this category");
            values.put(StatisticSQLiteOpenHelper.COL_TIMES_OPENED, 0);
            sqLiteDatabase.insert(StatisticSQLiteOpenHelper.TABLE_STATS, null, values);
        } else {
            Log.d(TAG, "Category was accessed " + catWasSavedOnce.getCount() + " times");
            values.put(StatisticSQLiteOpenHelper.COL_TIMES_OPENED, catWasSavedOnce.getCount() + 1);
            sqLiteDatabase.update(StatisticSQLiteOpenHelper.TABLE_STATS, values, StatisticSQLiteOpenHelper.COL_CATEGORY + " = " + categoryId, null);
        }
        catWasSavedOnce.close();
        close();
    }
}
