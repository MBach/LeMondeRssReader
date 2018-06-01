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

    /**
     * Constructor.
     *
     * @param context the context
     * @param name name of db
     * @param factory the factory
     * @param version version to use
     */
    LeMondeSQLiteOpenHelper(Context context, String name, SQLiteDatabase.CursorFactory factory, int version) {
        super(context, name, factory, version);
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
