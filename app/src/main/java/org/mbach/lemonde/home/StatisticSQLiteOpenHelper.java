package org.mbach.lemonde.home;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

/**
 * StatisticSQLiteOpenHelper class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-07
 */
public class StatisticSQLiteOpenHelper extends SQLiteOpenHelper {

    static final String TABLE_STATS = "table_stats";
    static final String COL_CATEGORY = "CATEGORY";
    static final String COL_TIMES_OPENED = "TIMES_OPENED";
    static final String COL_LAST_OPENED = "LAST_OPENED";

    private static final String CREATE_DATABASE = "CREATE TABLE " + TABLE_STATS + " ("
            + COL_CATEGORY + " INTEGER PRIMARY KEY, "
            + COL_TIMES_OPENED + " INTEGER NOT NULL, "
            + COL_LAST_OPENED + " INTEGER NOT NULL);";

    StatisticSQLiteOpenHelper(Context context, String name, SQLiteDatabase.CursorFactory factory, int version) {
        super(context, name, factory, version);
    }

    @Override
    public void onCreate(SQLiteDatabase sqLiteDatabase) {
        sqLiteDatabase.execSQL(CREATE_DATABASE);
    }

    @Override
    public void onUpgrade(SQLiteDatabase sqLiteDatabase, int i, int i1) {
        sqLiteDatabase.execSQL(String.format("DROP TABLE %s;", TABLE_STATS));
        onCreate(sqLiteDatabase);
    }
}
