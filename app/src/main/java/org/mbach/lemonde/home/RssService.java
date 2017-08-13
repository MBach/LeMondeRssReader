package org.mbach.lemonde.home;

import android.app.IntentService;
import android.app.PendingIntent;
import android.content.Intent;
import android.support.annotation.Nullable;
import android.util.Log;

import org.mbach.lemonde.Constants;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;

/**
 * RssService class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-06
 */
public class RssService extends IntentService {

    private static final String TAG = "RssService";
    private final RssParser parser = new RssParser();

    public static final int FETCH_SUCCESS = 0;
    public static final String CATEGORY = "CATEGORY";
    public static final String PENDING_RESULT = "RSS_SERVICE_PENDING_RESULT";
    public static final String PARCELABLE_EXTRAS = "PARCELABLE_EXTRAS";

    public RssService() {
        super("RssService");
    }

    @Override
    protected void onHandleIntent(Intent intent) {
        try {
            InputStream is = getInputStream(intent.getStringExtra(CATEGORY));
            if (is != null) {
                ArrayList<RssItem> rssItems = parser.parse(is);
                Intent result = new Intent();
                result.putParcelableArrayListExtra(PARCELABLE_EXTRAS, rssItems);
                PendingIntent reply = intent.getParcelableExtra(PENDING_RESULT);
                reply.send(this, FETCH_SUCCESS, result);
            }
        } catch (PendingIntent.CanceledException e) {
            Log.e(TAG, "onHandleIntent error", e);
        }
    }

    @Nullable
    private InputStream getInputStream(String category) {
        try {
            URL url = new URL(Constants.BASE_URL + category);
            URLConnection urlConnection = url.openConnection();
            urlConnection.setUseCaches(true);

            String cacheControl = urlConnection.getHeaderField("Cache-Control");
            Log.d(TAG, "Cache-Control flag: " + cacheControl);
            Log.d(TAG, "Last-Modified flag: " + urlConnection.getLastModified());
            return urlConnection.getInputStream();
        } catch (IOException e) {
            return null;
        }
    }
}
