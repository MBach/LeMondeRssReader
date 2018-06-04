package org.mbach.lemonde;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.support.annotation.NonNull;

/**
 * LeMondeSQLiteOpenHelper class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-07
 */
class LeMondeSQLiteOpenHelper extends SQLiteOpenHelper {

    private static final int DB_VERSION = 1;
    private static final String DB_NAME = "lemonde.db";

    /**
     * Constructor.
     *
     * @param context the context
     */
    LeMondeSQLiteOpenHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(@NonNull SQLiteDatabase sqLiteDatabase) {
        sqLiteDatabase.execSQL(LeMondeDB.StatEntry.CREATE_TABLE);
        sqLiteDatabase.execSQL(LeMondeDB.FavEntry.CREATE_TABLE);
    }

    @Override
    public void onUpgrade(@NonNull SQLiteDatabase sqLiteDatabase, int i, int i1) {
        sqLiteDatabase.execSQL(String.format("DROP TABLE %s;", LeMondeDB.StatEntry.TABLE));
        sqLiteDatabase.execSQL(String.format("DROP TABLE %s;", LeMondeDB.FavEntry.TABLE));
        onCreate(sqLiteDatabase);
    }
}
