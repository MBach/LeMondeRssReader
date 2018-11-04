package org.mbach.lemonde.article;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.preference.PreferenceManager;
import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;
import android.util.Log;
import android.util.TypedValue;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * LiveFeedParser class.
 *
 * @author Matthieu BACHELIER
 * @since 2018-04
 */
class LiveFeedParser {
    private static final String TAG = "LiveFeedParser";
    private static final String SCRIBBLELIVE_TOKEN = "6Im8rwIM";
    private static final String HTML = "HTML";

    @NonNull
    private final Context context;
    @NonNull
    private final Document document;
    @NonNull
    private final ArticleAdapter articleAdapter;

    LiveFeedParser(@NonNull Context context, @NonNull ArticleAdapter articleAdapter, @NonNull Document document) {
        this.context = context;
        this.articleAdapter = articleAdapter;
        this.document = document;
    }

    @NonNull
    ArrayList<Model> extractLiveFacts() {
        TextView headLine = new TextView(context);
        TextView description = new TextView(context);

        int defaultText = ThemeUtils.getStyleableColor(context, R.styleable.CustomTheme_defaultText);

        headLine.setTextColor(defaultText);
        description.setTextColor(defaultText);

        headLine.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_headline));
        description.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_description));

        if (!document.getElementsByClass("title js-live-page-title").isEmpty()) {
            headLine.setText(document.getElementsByClass("title js-live-page-title").first().text());
        }
        if (!document.getElementsByClass("description js-live-page-description").isEmpty()) {
            description.setText(document.getElementsByClass("description js-live-page-description").first().text());
        }
        ArrayList<Model> views = new ArrayList<>();
        views.add(new Model(headLine));
        views.add(new Model(description));

        // Extract facts, if any
        Elements factBlock = document.getElementsByClass("facts-content");
        if (ArticleActivity.atLeastOneChild(factBlock)) {
            List<Model> factList = new ArrayList<>();
            Elements facts = factBlock.first().getElementsByTag("ul");
            for (Element fact : facts) {
                TextView factView = new TextView(context);
                factView.setText(fact.text());
                CardView cardView = new CardView(context);
                cardView.addView(factView);
                factList.add(new Model(Model.FACTS_TYPE, cardView));
            }

            // Add header only if there's at least one fact
            if (!factList.isEmpty()) {
                TextView liveFacts = new TextView(context);
                liveFacts.setText(context.getString(R.string.live_facts));
                liveFacts.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_description));
                views.add(new Model(liveFacts));
            }
            views.addAll(factList);
        }
        return views;
    }

    /**
     * Parse remote webservice URL and enqueue request.
     *
     * @param liveScript script to parse
     */
    void fetchPosts(@NonNull String liveScript) {
        // We need to extract the EventID for every live using regular expressions
        Pattern p = Pattern.compile("base\\.start\\(provider, '([0-9]+)'\\);");
        Matcher m = p.matcher(liveScript);
        if (m.find()) {
            String eventId = m.group(1);
            // The credential seems to be static, so we're assuming it won't change over time
            String livePostsURI = "https://apiv1secure.scribblelive.com/event/" + eventId + "/page/last?token=" + SCRIBBLELIVE_TOKEN + "&format=json&pageSize=20";
            ArticleActivity.REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, livePostsURI, factsReceived, errorResponse));
        }
    }

    /**
     * See @articleReceived field.
     */
    private final Response.Listener<String> factsReceived = new Response.Listener<String>() {
        @Override
        public void onResponse(String response) {
            SimpleDateFormat sdf = new SimpleDateFormat("'Le 'dd/MM/yyyy' à 'HH:mm", Locale.FRENCH);
            try {
                JSONObject json = new JSONObject(response);
                JSONArray posts = json.getJSONArray("Posts");
                ArrayList<Model> facts = new ArrayList<>();

                // Subtitle
                TextView followLive = new TextView(context);
                followLive.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_description));
                followLive.setText(R.string.live_events);

                // Date and post details are extracted from JSON
                facts.add(new Model(followLive));
                Pattern datePattern = Pattern.compile("/Date\\(([0-9]+)\\+0000\\)/");
                Pattern quotePattern = Pattern.compile("(.*)<blockquote>(.*)</blockquote>", Pattern.DOTALL);
                for (int i = 0; i < posts.length(); i++) {
                    // Extract date
                    JSONObject post = posts.getJSONObject(i);
                    Matcher dateMatcher = datePattern.matcher(post.getString("LastModified"));
                    if (dateMatcher.find()) {
                        RecyclerView.LayoutParams lp = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                        lp.setMargins(0, 24, 0, 0);

                        TextView factHeader = new TextView(context);
                        factHeader.setText(sdf.format(new Date(Long.valueOf(dateMatcher.group(1)))));
                        factHeader.setLayoutParams(lp);
                        facts.add(new Model(factHeader));
                    }

                    // Extract tag
                    if (post.has("Icons")) {
                        JSONArray icons = post.getJSONArray("Icons");
                        for (int j = 0; j < icons.length(); j++) {
                            JSONObject icon = icons.getJSONObject(j);
                            TextView iconText = new TextView(context);
                            RecyclerView.LayoutParams lp = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                            lp.setMargins(0, 24, 0, 24);
                            iconText.setLayoutParams(lp);
                            iconText.setPadding(Constants.PADDING_LEFT_RIGHT_TAG, Constants.PADDING_BOTTOM, Constants.PADDING_LEFT_RIGHT_TAG, Constants.PADDING_BOTTOM);
                            iconText.setBackgroundColor(Color.parseColor(icon.getString("Color")));
                            iconText.setTextColor(Color.parseColor(icon.getString("TextColor")));
                            iconText.setText(icon.getString("Name"));
                            facts.add(new Model(iconText));
                        }
                    }

                    // Extract main content
                    TextView factContent = new TextView(context);
                    factContent.setId(Integer.valueOf(post.getString("Id")));
                    String content = post.getString("Content");
                    Matcher quoteMatcher = quotePattern.matcher(content);
                    if (quoteMatcher.find()) {
                        String firstGroup = quoteMatcher.group(1);
                        if (!firstGroup.isEmpty()) {
                            TextView textViewG1 = new TextView(context);
                            textViewG1.setText(Jsoup.parse(firstGroup).text());
                            facts.add(new Model(textViewG1));
                        }
                        String secondGroup = quoteMatcher.group(2);
                        TextView textViewQuote = new TextView(context);
                        textViewQuote.setText(Jsoup.parse(secondGroup).text());
                        textViewQuote.setTypeface(null, Typeface.ITALIC);
                        textViewQuote.setPadding(Constants.PADDING_LEFT_RIGHT_TAG, Constants.PADDING_BOTTOM, 0, 0);
                        facts.add(new Model(textViewQuote));
                    } else if (HTML.equals(post.getString("Type"))) {
                        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
                        boolean displayTweets = sharedPreferences.getBoolean("displayTweets", false);
                        // Iterate over a small document
                        for (Element element : Jsoup.parse(content).body().children()) {
                            // Clean tweets

                            // Check if there are pictures in the live feed
                            Elements figures = element.getElementsByTag("figure");
                            Elements images = element.getElementsByTag("img");
                            if (figures.isEmpty() && images.isEmpty()) {
                                if (displayTweets && !element.getElementsByClass("twitter-tweet").isEmpty()) {
                                    TextView t = new TextView(context);
                                    //ArticleActivity.fromHtml(t, element.html());
                                    Button link = new Button(context);
                                    Elements links = element.select("a[href]");
                                    if (ArticleActivity.atLeastOneChild(links)) {
                                        link.setContentDescription(links.first().attr("href"));
                                    }
                                    CardView cardView = new CardView(context);
                                    cardView.addView(t);
                                    cardView.addView(link);
                                    facts.add(new Model(Model.TWEET_TYPE, cardView));
                                } else if (!element.text().replace("\u00a0", "").replace("\n", "").isEmpty()) {
                                    //Log.d(TAG, "text = '" + element.text().trim() + "'");
                                    TextView t = new TextView(context);
                                    ArticleActivity.fromHtml(t, element.html());
                                    facts.add(new Model(t));
                                }
                            } else {
                                if (images.isEmpty()) {
                                    Element figure = figures.first();
                                    Elements imgs = figure.getElementsByTag("img");
                                    if (!imgs.isEmpty()) {
                                        facts.add(new Model(Model.IMAGE_TYPE, images.first().attr("src")));
                                    }
                                } else {
                                    Element img = images.first();
                                    facts.add(new Model(Model.IMAGE_TYPE, img.attr("src")));
                                }
                            }
                        }
                    } else {
                        factContent.setText(content);
                        facts.add(new Model(factContent));
                    }
                }
                articleAdapter.addItems(facts);
            } catch (JSONException e) {
                Log.e(TAG, e.getMessage());
            }
        }
    };

    /**
     *
     */
    private final Response.ErrorListener errorResponse = new Response.ErrorListener() {
        @Override
        public void onErrorResponse(VolleyError error) {
            Log.e(TAG, "onErrorResponse: " + error.toString());
            Log.e(TAG, "onErrorResponse: " + error.networkResponse);
            Log.e(TAG, "onErrorResponse: " + error.getMessage());
        }
    };
}
