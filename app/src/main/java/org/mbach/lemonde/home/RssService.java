package org.mbach.lemonde.home;

import android.app.IntentService;
import android.app.PendingIntent;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.TimeoutError;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;

/**
 * RssService class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-06
 */
public class RssService extends IntentService {

    private static final String TAG = "RssService";
    @Nullable
    private static RequestQueue REQUEST_QUEUE = null;

    public static final int FETCH_SUCCESS = 0;
    public static final int FETCH_TIMEOUT = 1;
    public static final String CATEGORY = "CATEGORY";
    public static final String PENDING_RESULT = "RSS_SERVICE_PENDING_RESULT";
    public static final String PARCELABLE_EXTRAS = "PARCELABLE_EXTRAS";

    private final RssParser parser = new RssParser();
    private PendingIntent reply;

    public RssService() {
        super("RssService");
    }

    @Override
    protected void onHandleIntent(@Nullable final Intent intent) {
        if (REQUEST_QUEUE == null) {
            REQUEST_QUEUE = Volley.newRequestQueue(this);
        }
        if (intent != null) {
            reply = intent.getParcelableExtra(PENDING_RESULT);
            REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, Constants.BASE_URL + intent.getStringExtra(CATEGORY), onFeedReceived, onErrorResponse));
        }
    }

    /**
     *
     */
    private final Response.Listener<String> onFeedReceived = new Response.Listener<String>() {
        @Override
        public void onResponse(String response) {
            try {
                ArrayList<RssItem> rssItems = parser.parse(new String(response.getBytes("ISO-8859-1")));
                Intent result = new Intent();
                result.putParcelableArrayListExtra(PARCELABLE_EXTRAS, rssItems);
                reply.send(RssService.this, FETCH_SUCCESS, result);
            } catch (@NonNull PendingIntent.CanceledException | UnsupportedEncodingException e) {
                Log.e(TAG, "onHandleIntent error", e);
            }
        }
    };

    /**
     *
     */
    private final Response.ErrorListener onErrorResponse = new Response.ErrorListener() {
        @Override
        public void onErrorResponse(VolleyError error) {
            if (error instanceof TimeoutError) {
                //Toast.makeText(getBaseContext(), getString(R.string.error_timeout), Toast.LENGTH_LONG).show();
                try {
                    reply.send(FETCH_TIMEOUT);
                } catch (@NonNull PendingIntent.CanceledException e) {
                    Log.e(TAG, "onHandleIntent error", e);
                }
            } else {
                Log.e(TAG, error.toString());
            }
        }
    };
}
