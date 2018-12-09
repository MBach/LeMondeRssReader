package org.mbach.lemonde.article;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Parcelable;
import android.preference.PreferenceManager;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.appbar.CollapsingToolbarLayout;
import com.google.android.material.snackbar.Snackbar;

import androidx.core.content.ContextCompat;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.appcompat.widget.Toolbar;
import android.text.Html;
import android.text.TextUtils;
import android.util.Log;
import android.util.TypedValue;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AlphaAnimation;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;
import com.github.mikephil.charting.charts.Chart;
import com.squareup.picasso.Picasso;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.mbach.lemonde.Constants;
import org.mbach.lemonde.LeMondeDB;
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;
import org.mbach.lemonde.account.LoginActivity;
import org.mbach.lemonde.home.MainActivity;
import org.mbach.lemonde.home.RssItem;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ArticleActivity class fetch an article from an URI, and parse the HTML response.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class ArticleActivity extends AppCompatActivity {

    private static final String TAG = "ArticleActivity";
    private static final String STATE_RECYCLER_VIEW_POS = "STATE_RECYCLER_VIEW_POS";
    private static final String STATE_RECYCLER_VIEW = "STATE_RECYCLER_VIEW";
    private static final String STATE_ADAPTER_ITEM = "STATE_ADAPTER_ITEM";
    private static final String ATTR_HEADLINE = "h1.article__title";
    private static final String ATTR_DESCRIPTION = "p.article__desc";
    private static final String ATTR_READ_TIME = "p.meta__reading-time";
    private static final String ATTR_AUTHOR = "span.meta__author";
    private static final String ATTR_DATE = "span.meta__date";
    private static final String TAG_TRUE = "vrai";
    private static final String TAG_FAKE = "faux";
    private static final String TAG_MOSTLY_TRUE = "plutot_vrai";
    private static final String TAG_FORGOTTEN = "oubli";
    private static final String IMAGE_PREFIX = "https://img.lemde.fr/";

    @Nullable
    static RequestQueue REQUEST_QUEUE = null;

    private final ArticleAdapter articleAdapter = new ArticleAdapter();
    private final AlphaAnimation animationFadeIn = new AlphaAnimation(0, 1);
    private RecyclerView recyclerView;
    private ProgressBar autoLoader;
    private MenuItem shareItem;
    private MenuItem toggleFavItem;
    @Nullable
    private String shareLink;
    private String commentsURI;
    private String shareSubject;
    private String shareText;
    private boolean isRestricted = false;
    private int articleId = 0;

    @Override
    public boolean dispatchTouchEvent(MotionEvent motionEvent) {
        try {
            return super.dispatchTouchEvent(motionEvent);
        } catch (NullPointerException e) {
            return false;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ThemeUtils.applyTheme(getBaseContext(), getTheme());
        setContentView(R.layout.activity_article);
        setTitle("");

        final LinearLayoutManager linearLayoutManager = new LinearLayoutManager(this);
        recyclerView = findViewById(R.id.articleActivityRecyclerView);
        recyclerView.setLayoutManager(linearLayoutManager);
        recyclerView.setAdapter(articleAdapter);
        Toolbar toolbar = findViewById(R.id.toolbarArticle);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        final CollapsingToolbarLayout collapsingToolbar = findViewById(R.id.collapsing_toolbar);
        AppBarLayout appBarLayout = findViewById(R.id.articleAppBarLayout);
        appBarLayout.addOnOffsetChangedListener(new AppBarLayout.OnOffsetChangedListener() {

            @Override
            public void onOffsetChanged(@NonNull AppBarLayout appBarLayout, int verticalOffset) {
                if (shareItem == null) {
                    return;
                }
                // XXX: convert to independent unit
                //Log.d(TAG, "verticalOffset = " + verticalOffset);
                View share = findViewById(R.id.action_share);

                if (Math.abs(verticalOffset) - appBarLayout.getTotalScrollRange() == 0) {
                    shareItem.setVisible(true);
                    if (share != null) {
                        share.startAnimation(animationFadeIn);
                    }
                } else {
                    shareItem.setVisible(false);
                }
            }
        });

        if (REQUEST_QUEUE == null) {
            REQUEST_QUEUE = Volley.newRequestQueue(this);
        }

        autoLoader = findViewById(R.id.autoLoader);
        recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
                if (recyclerView.getLayoutManager() != null && linearLayoutManager.findLastCompletelyVisibleItemPosition() == recyclerView.getLayoutManager().getItemCount() - 1) {
                    if (Constants.BASE_URL2.equals(commentsURI)) {
                        autoLoader.setVisibility(View.INVISIBLE);
                        Snackbar.make(findViewById(R.id.coordinatorArticle), getString(R.string.no_more_comments_to_load), Snackbar.LENGTH_LONG).show();
                    } else if (commentsURI != null) {
                        autoLoader.setVisibility(View.VISIBLE);
                        REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, commentsURI, commentsReceived, errorResponse));
                    }
                } else {
                    autoLoader.setVisibility(View.INVISIBLE);
                }
                super.onScrolled(recyclerView, dx, dy);
            }
        });

        // If user is opening a link from another App, like a mail client for instance
        final Intent intent = getIntent();
        final String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) {
            shareLink = intent.getDataString();
        } else if (intent.getExtras() != null) {
            collapsingToolbar.setTitle(intent.getExtras().getString(Constants.EXTRA_NEWS_CATEGORY));
            Picasso.with(this)
                    .load(intent.getExtras().getString(Constants.EXTRA_RSS_IMAGE))
                    .into((ImageView) findViewById(R.id.imageArticle));
            shareLink = intent.getExtras().getString(Constants.EXTRA_RSS_LINK);
            int articleId = intent.getExtras().getInt(Constants.EXTRA_RSS_ARTICLE_ID);
            if (articleId > 0) {
                this.articleId = articleId;
            }
        }

        // Start async job
        int lastFirstVisiblePosition = getIntent().getIntExtra(STATE_RECYCLER_VIEW_POS, -1);
        // If we have stored the position, it means we also have stored state and items from the recycler view
        if (lastFirstVisiblePosition >= 0) {
            Parcelable parcelable = getIntent().getParcelableExtra(STATE_RECYCLER_VIEW);
            if (recyclerView.getLayoutManager() != null) {
                recyclerView.getLayoutManager().onRestoreInstanceState(parcelable);
            }
            ArrayList<Model> items = getIntent().getParcelableArrayListExtra(STATE_ADAPTER_ITEM);
            articleAdapter.addItems(items);
            recyclerView.getLayoutManager().scrollToPosition(lastFirstVisiblePosition);
        } else {
            REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, shareLink, articleReceived, errorResponse));
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // Do not display the loader once again after resuming this activity
        if (articleAdapter.getItemCount() > 0) {
            findViewById(R.id.articleLoader).setVisibility(View.GONE);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Save position, state, and items before rotating the device
        if (recyclerView.getLayoutManager() != null) {
            int lastFirstVisiblePosition = ((LinearLayoutManager) recyclerView.getLayoutManager()).findFirstCompletelyVisibleItemPosition();
            Parcelable parcelable = recyclerView.getLayoutManager().onSaveInstanceState();
            getIntent().putExtra(STATE_RECYCLER_VIEW, parcelable);
            getIntent().putExtra(STATE_RECYCLER_VIEW_POS, lastFirstVisiblePosition);
            getIntent().putParcelableArrayListExtra(STATE_ADAPTER_ITEM, articleAdapter.getItems());
        }
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (android.R.id.home == item.getItemId()) {
            if (Intent.ACTION_VIEW.equals(getIntent().getAction())) {
                startActivity(new Intent(getApplicationContext(), MainActivity.class));
            } else {
                onBackPressed();
            }
        }
        return true;
    }

    @Override
    public boolean onCreateOptionsMenu(@NonNull Menu menu) {
        final SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        boolean shareContent = sharedPreferences.getBoolean("shareOnSocialNetworks", true);
        if (shareContent) {
            getMenuInflater().inflate(R.menu.articleactivity_right_menu, menu);
            shareItem = menu.findItem(R.id.action_share);
            /// FIXME
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    animationFadeIn.setDuration(1000);
                    shareItem.setVisible(true);
                }
            }, 1);
            shareItem.setOnMenuItemClickListener(new MenuItem.OnMenuItemClickListener() {
                @Override
                public boolean onMenuItemClick(MenuItem menuItem) {
                    Intent shareIntent = new Intent();
                    shareIntent.setAction(Intent.ACTION_SEND);
                    shareIntent.putExtra(Intent.EXTRA_SUBJECT, shareSubject);
                    shareIntent.putExtra(Intent.EXTRA_TEXT, shareText + " " + shareLink);
                    shareIntent.setType("text/plain");
                    startActivity(Intent.createChooser(shareIntent, getResources().getText(R.string.share_article)));
                    return false;
                }
            });
            toggleFavItem = menu.findItem(R.id.action_toggle_fav);
            toggleFavItem.setOnMenuItemClickListener(new MenuItem.OnMenuItemClickListener() {
                @Override
                public boolean onMenuItemClick(MenuItem menuItem) {
                    final LeMondeDB leMondeDB = new LeMondeDB(ArticleActivity.this);
                    boolean hasArticle = leMondeDB.hasArticle(articleId);
                    if (hasArticle && leMondeDB.deleteArticle(articleId)) {
                        hasArticle = false;
                        Snackbar.make(findViewById(R.id.coordinatorArticle), getString(R.string.favorites_article_removed), Snackbar.LENGTH_SHORT).show();
                    } else {
                        RssItem favorite = new RssItem(RssItem.ARTICLE_TYPE);
                        favorite.setArticleId(articleId);
                        if (getIntent().getExtras() != null) {
                            favorite.setTitle(getIntent().getExtras().getString(Constants.EXTRA_RSS_TITLE));
                            favorite.setPubDate(getIntent().getExtras().getLong(Constants.EXTRA_RSS_DATE));
                            favorite.setEnclosure(getIntent().getExtras().getString(Constants.EXTRA_RSS_IMAGE));
                        }
                        favorite.setLink(shareLink);
                        favorite.setCategory(getTitle().toString());
                        if (leMondeDB.saveArticle(favorite)) {
                            hasArticle = true;
                            Snackbar.make(findViewById(R.id.coordinatorArticle), getString(R.string.favorites_article_added), Snackbar.LENGTH_SHORT).show();
                        }
                    }
                    toggleFavIcon(hasArticle);
                    return false;
                }
            });
        }
        return true;
    }

    public void openTweet(@NonNull View view) {
        Button button = view.findViewById(R.id.tweet_button);
        String link = button.getContentDescription().toString();
        Uri uri;
        if (link.isEmpty()) {
            uri = Uri.parse("https://www.twitter.com");
        } else {
            uri = Uri.parse(link);
        }
        startActivity(new Intent(Intent.ACTION_VIEW, uri));
    }

    public void openSource(@NonNull View view) {
        Button button = view.findViewById(R.id.graphSource);
        String link = button.getContentDescription().toString();
        Uri uri;
        if (!link.isEmpty()) {
            uri = Uri.parse(link);
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        }
    }

    public void goToAccount(@SuppressWarnings("unused") View view) {
        startActivity(new Intent(this, LoginActivity.class));
    }

    public void register(@SuppressWarnings("unused") View view) {
        Uri uri = Uri.parse("https://abo.lemonde.fr");
        startActivity(new Intent(Intent.ACTION_VIEW, uri));
    }

    /**
     * This listener is a callback which can parse and extract the HTML page that has been received after
     * an asynchronous call to the web. Jsoup library is used to parse the response and not to make the call.
     * Otherwise, a NetworkOnMainThreadException will be fired by the system.
     */
    @Nullable
    private final Response.Listener<String> articleReceived = new Response.Listener<String>() {
        @Override
        public void onResponse(String response) {
            // Hide icon
            findViewById(R.id.noNetwork).setVisibility(View.INVISIBLE);

            Document doc = Jsoup.parse(response);

            // If article was loaded from an external App, no image was passed from MainActivity,
            // so it must be fetched in the Collapsing Toolbar
            if (Intent.ACTION_VIEW.equals(getIntent().getAction())) {
                Elements image = doc.select("meta[property=og:image]");
                if (atLeastOneChild(image)) {
                    Picasso.with(ArticleActivity.this)
                            .load(image.first().attr("content"))
                            .into((ImageView) findViewById(R.id.imageArticle));
                }
            }

            // Article is from a hosted blog
            ArrayList<Model> items;
            /// FIXME
            /*Elements content = doc.select("section.zone--article");
            if (content == null) {
                items = new ArrayList<>();
                //items = extractBlogArticle(content.first());
                //setTagInHeader(R.string.blog_article, R.color.accent_complementary, Color.WHITE);
            } else {
                Elements category = doc.select("div.tt_rubrique_ombrelle");
                if (atLeastOneChild(category)) {
                    setTitle(category.text());
                }
                Elements articles = doc.getElementsByTag("section");
                Element largeFormat = doc.getElementById("hors_format");
                if (largeFormat != null) {
                    items = new ArrayList<>();
                    setTagInHeader(R.string.large_article, R.color.primary_dark, Color.WHITE);
                } else if (articles.isEmpty()) {
                    Elements liveContainer = doc.getElementsByClass("live2-container");
                    if (liveContainer.isEmpty()) {
                        // Video
                        items = extractVideo(doc);
                        setTagInHeader(R.string.video_article, R.color.accent_complementary, Color.WHITE);
                    } else {
                        LiveFeedParser liveFeedParser = new LiveFeedParser(getApplicationContext(), articleAdapter, doc);
                        items = liveFeedParser.extractLiveFacts();
                        liveFeedParser.fetchPosts(liveContainer.select("script").html());
                        setTagInHeader(R.string.live_article, R.color.accent_live, Color.WHITE);
                    }
                } else {*/

            // Standard article
            items = extractData(doc);
            LeMondeDB leMondeDB = new LeMondeDB(ArticleActivity.this);
            // Full article is restricted to paid members
            isRestricted = doc.getElementById("teaser_article") != null;
            Log.d(TAG, "articleId " + articleId);
            boolean hasArticle = leMondeDB.hasArticle(articleId);
            toggleFavIcon(hasArticle);
            if (isRestricted) {
                if (shareItem != null) {
                    shareItem.setIcon(getResources().getDrawable(R.drawable.ic_share_black));
                }
                CollapsingToolbarLayout collapsingToolbar = findViewById(R.id.collapsing_toolbar);
                collapsingToolbar.setContentScrimResource(R.color.accent);
                collapsingToolbar.setCollapsedTitleTextColor(getResources().getColor(R.color.primary_dark));
                setTagInHeader(R.string.paid_article, R.color.accent, Color.BLACK);

                if (getSupportActionBar() != null) {
                    final Drawable upArrow = getResources().getDrawable(R.drawable.ic_arrow_back_black_24dp);
                    getSupportActionBar().setHomeAsUpIndicator(upArrow);
                }

                // Add a button before comments where the user can connect
                CardView connectButton = new CardView(ArticleActivity.this);
                items.add(new Model(Model.BUTTON_TYPE, connectButton));
            }
            // After parsing the article, start a new request for comments
            Element react = doc.getElementById("liste_reactions");
            if (react != null) {
                Elements dataAjURI = react.select("[^data-aj-uri]");
                if (atLeastOneChild(dataAjURI)) {
                    String commentPreviewURI = Constants.BASE_URL2 + dataAjURI.first().attr("data-aj-uri");
                    REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, commentPreviewURI, commentsReceived, errorResponse));
                }
            }
                //}
            //}
            articleAdapter.addItems(items);
            findViewById(R.id.articleLoader).setVisibility(View.GONE);
        }
    };

    private void toggleFavIcon(boolean hasArticle) {
        if (isRestricted && toggleFavItem != null) {
            if (hasArticle) {
                toggleFavItem.setIcon(getResources().getDrawable(R.drawable.star_full_black));
            } else {
                toggleFavItem.setIcon(getResources().getDrawable(R.drawable.star_border_black));
            }
        } else if (toggleFavItem != null) {
            if (hasArticle) {
                if (ThemeUtils.isDarkTheme(ArticleActivity.this)) {
                    toggleFavItem.setIcon(getResources().getDrawable(R.drawable.star_full_light));
                } else {
                    toggleFavItem.setIcon(getResources().getDrawable(R.drawable.star_full_black));
                }
            } else {
                if (ThemeUtils.isDarkTheme(ArticleActivity.this)) {
                    toggleFavItem.setIcon(getResources().getDrawable(R.drawable.star_border_light));
                } else {
                    toggleFavItem.setIcon(getResources().getDrawable(R.drawable.star_border_black));
                }
            }
        } else {
            Log.d(TAG, "toggleFavItem is null :(");
        }
    }

    /**
     * This helper method is used to customize the header (in the AppBar) to display a tag or a bubble when the current
     * article comes from an hosted blog, or is restricted to paid members.
     *
     * @param stringId        string to display in the AppBar
     * @param backgroundColor color of the background
     * @param textColor       color of the text to display
     */
    private void setTagInHeader(int stringId, int backgroundColor, int textColor) {
        TextView tagArticle = findViewById(R.id.tagArticle);
        tagArticle.setText(getString(stringId));
        tagArticle.setBackgroundColor(ContextCompat.getColor(getBaseContext(), backgroundColor));
        tagArticle.setTextColor(textColor);
        tagArticle.setVisibility(View.VISIBLE);
    }

    /**
     * See @articleReceived field.
     */
    private final Response.Listener<String> commentsReceived = new Response.Listener<String>() {
        @Override
        public void onResponse(String response) {
            Document commentDoc = Jsoup.parse(response);

            ArrayList<Model> items = new ArrayList<>();
            // Extract header
            Elements header = commentDoc.select("[itemprop='InteractionCount']");
            if (atLeastOneChild(header)) {
                TextView commentHeader = new TextView(ArticleActivity.this);
                commentHeader.setText(String.format("Commentaires %s", header.text()));
                commentHeader.setTypeface(null, Typeface.BOLD);
                commentHeader.setPadding(0, 0, 0, Constants.PADDING_COMMENT_ANSWER);
                items.add(new Model(commentHeader, 0));
            }

            // Extract comments
            Elements comments = commentDoc.select("[itemprop='commentText']");
            for (Element comment : comments) {
                Elements refs = comment.select("p.references");
                if (atLeastOneChild(refs)) {
                    // Clear date
                    refs.select("span").remove();
                    TextView author = new TextView(ArticleActivity.this);
                    author.setTypeface(null, Typeface.BOLD);
                    author.setText(refs.text());

                    Elements commentComment = refs.next();
                    if (atLeastOneChild(commentComment)) {
                        TextView content = new TextView(ArticleActivity.this);
                        content.setText(commentComment.first().text());
                        if (comment.hasClass("reponse")) {
                            author.setPadding(Constants.PADDING_COMMENT_ANSWER, 0, 0, 12);
                            content.setPadding(Constants.PADDING_COMMENT_ANSWER, 0, 0, 16);
                        } else {
                            author.setPadding(0, 0, 0, 12);
                            content.setPadding(0, 0, 0, 16);
                        }
                        int commentId = Integer.valueOf(comment.attr("data-reaction_id"));
                        items.add(new Model(author, commentId));
                        items.add(new Model(content, commentId));
                    }
                }
            }
            // Extract full comments page URI
            Elements div = commentDoc.select("div.reactions");

            if (atLeastOneChild(div)) {
                Element fullComments = div.first().nextElementSibling();
                Elements next = fullComments.select("a");
                if (atLeastOneChild(next)) {
                    commentsURI = Constants.BASE_URL2 + next.first().attr("href");
                }
            }
            articleAdapter.addItems(items);
        }
    };

    /**
     * See @articleReceived field.
     */
    @Nullable
    private final Response.ErrorListener errorResponse = new Response.ErrorListener() {
        @Override
        public void onErrorResponse(VolleyError error) {
            findViewById(R.id.articleLoader).setVisibility(View.GONE);

            ConnectivityManager cm = (ConnectivityManager) getBaseContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
                if (activeNetwork == null || !activeNetwork.isConnectedOrConnecting()) {
                    // Display icon
                    findViewById(R.id.noNetwork).setVisibility(View.VISIBLE);
                    // Display permanent message
                    Snackbar.make(findViewById(R.id.coordinatorArticle), getString(R.string.error_no_connection), Snackbar.LENGTH_INDEFINITE)
                            .setAction(getString(R.string.error_no_connection_retry), new View.OnClickListener() {
                                @Override
                                public void onClick(View v) {
                                    REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, shareLink, articleReceived, errorResponse));
                                }
                            }).show();
                }
            }
        }
    };

    /**
     * Check if elements has at least one child.
     * This helper is useful because Elements.select() returns a collection of nodes.
     *
     * @param elements nodes to check
     * @return true if elements can be safely called with first()
     */
    public static boolean atLeastOneChild(@Nullable Elements elements) {
        return elements != null && !elements.isEmpty();
    }

    /**
     * Extract and parse a standard article. A standard article is published on the main page and by definition,
     * is not: from a hosted blog, nor a video, nor a special multimedia content. It has some standardized fields like
     * one (or multiple) author(s), a date, a description, an headline, a description and a list of paragraphs.
     * Each paragraph is a block of text (comments included) or an image or an embedded tweet.
     *
     * @param doc article to analyze
     * @return a list of formatted content that can be nicely displayed in the recycler view.
     */
    private ArrayList<Model> extractData(@NonNull Document doc) {

        Elements scripts = doc.getElementsByTag("script");
        String data = null;
        for (Element element : scripts) {
            String html = element.html();
            if (html.startsWith("var lmd=")) {
                data = html;
                break;
            }
        }

        ArrayList<Model> models = new ArrayList<>();
        if (data == null) {
            return models;
        }

        try {
            JSONObject json = new JSONObject(data.substring(8));
            JSONObject context = json.getJSONObject("context");
            JSONObject article = context.getJSONObject("article");
            JSONArray parsedAuthors = article.getJSONArray("parsedAuthors");

            TextView headLine = new TextView(this);
            TextView authors = new TextView(this);
            TextView dates = new TextView(this);
            TextView description = new TextView(this);
            TextView readTime = new TextView(this);

            headLine.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_headline));
            authors.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_authors));
            dates.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_authors));
            description.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_description));
            readTime.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_description));

            fromHtml(headLine, article.getString("title"));
            fromHtml(description, article.getString("chapo"));
            List<String> a = new ArrayList<>();
            for (int i = 0; i < parsedAuthors.length(); i++) {
                JSONObject author = (JSONObject) parsedAuthors.get(i);
                a.add(author.getString("name"));
            }
            authors.setText(String.format("Par %1$s", TextUtils.join(",", a)));
            JSONObject createdAt = article.getJSONObject("createdAt");
            JSONObject updatedAt = article.optJSONObject("updatedAt");
            if (updatedAt == null) {
                dates.setText(String.format("Publié le %1$s", createdAt.getString("date")));
            } else {
                dates.setText(String.format("Publié le %1$s, mis à jour le %2$s", createdAt.getString("date"), updatedAt.getString("date")));
            }
            readTime.setText(String.format("Lecture %1$s min.", article.getInt("readingTime")));

            models.add(new Model(headLine));
            models.add(new Model(authors));
            models.add(new Model(dates));
            models.add(new Model(description));
            models.add(new Model(readTime));

            // Extract the rest
            JSONArray parsedNodes = article.getJSONArray("parsedNodes");
            for (int i = 0; i < parsedNodes.length(); i++) {
                JSONObject parsedNode = (JSONObject) parsedNodes.get(i);
                JSONObject content = parsedNode.getJSONObject("content");
                switch (parsedNode.getString("type")) {
                    case "text":
                        TextView paragraph = new TextView(this);
                        fromHtml(paragraph, content.getString("text"));
                        if (content.getString("type").equals("heading")) {
                            paragraph.setTypeface(Typeface.SERIF);
                            paragraph.setPadding(0, Constants.PADDING_TOP_SUBTITLE, 0, Constants.PADDING_BOTTOM_SUBTITLE);
                            paragraph.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_description));
                        } else {
                            paragraph.setPadding(0, 0, 0, Constants.PADDING_BOTTOM);
                            paragraph.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_body));
                        }
                        models.add(new Model(paragraph, Model.TEXT_TYPE));
                        break;
                    case "media":
                        if (content.getString("type").equals("image")) {
                            String image = String.format("%s%s", IMAGE_PREFIX, content.getJSONObject("media").getString("cloudPath"));
                            Log.d(TAG, image);
                            models.add(new Model(Model.IMAGE_TYPE, image));
                        }
                        break;
                }

            }
        } catch (JSONException e) {
            Log.e(TAG, "error", e);
        }

        //doc.select("");
        return models;
    }

    /**
     * This method is not functionnal at this moment.
     *
     * @param doc the document to analyze
     * @return a list of formatted content that can be nicely displayed in the recycler view.
     */
    @NonNull
    private ArrayList<Model> extractVideo(@NonNull Document doc) {
        Elements elements = doc.select("section.video");
        if (elements.isEmpty()) {
            return new ArrayList<>();
        }

        TextView headLine = new TextView(this);
        TextView authors = new TextView(this);
        TextView dates = new TextView(this);
        TextView content = new TextView(this);

        headLine.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_headline));
        authors.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_authors));
        dates.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_authors));
        content.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_body));

        Element video = elements.first();
        headLine.setText(extractAttr(video, ATTR_HEADLINE));
        authors.setText(extractAttr(video, ATTR_AUTHOR));
        dates.setText(extractDates(video));
        Elements els = video.select("div.grid_12.alpha");
        if (atLeastOneChild(els)) {
            els.select("h2").remove();
            els.select("span.txt_gris_soutenu").remove();
            els.select("#recos_videos_outbrain").remove();
            fromHtml(content, els.html());
        }
        ArrayList<Model> views = new ArrayList<>();
        views.add(new Model(headLine));
        views.add(new Model(authors));
        views.add(new Model(dates));
        views.add(new Model(content));
        Elements scripts = doc.getElementsByTag("script");
        for (Element script : scripts) {
            if (script.html().contains("lmd/module/video/player")) {
                Pattern p = Pattern.compile("url: '//(.+)',", Pattern.DOTALL);
                Matcher m = p.matcher(script.html());
                if (m.find()) {
                    String iFrame = m.group(1);
                    REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, "https://" + iFrame, videoFrameReceived, errorResponse));
                }
            }
        }
        return views;
    }

    /**
     * Extract Video URI.
     */
    private final Response.Listener<String> videoFrameReceived = new Response.Listener<String>() {
        @Override
        public void onResponse(@NonNull String response) {
            Pattern p = Pattern.compile("\"mp4_720\":\"(https:.*\\.mp4)\\?mdtk=.*\",\"mp4_480\":.*", Pattern.DOTALL);
            Matcher m = p.matcher(response);
            if (m.find()) {
                String videoURI = m.group(1);
                videoURI = videoURI.replace("\\", "");
                Model model = new Model(Model.VIDEO_TYPE, Uri.parse(videoURI));
                articleAdapter.addItem(model);
                Log.d(TAG, "videoURI = " + videoURI);
            } else {
                Log.d(TAG, "not found >> " + response);
            }
        }
    };

    /**
     * Static fromHtml to deal with older SDK.
     *
     * @param textView the textView to fill
     * @param html     raw string
     */
    static void fromHtml(@NonNull TextView textView, String html) {
        if (android.os.Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            textView.setText(Html.fromHtml(html));
        } else {
            textView.setText(Html.fromHtml(html, Html.FROM_HTML_MODE_COMPACT));
        }
    }

    @NonNull
    private String extractAttr(@NonNull Element article, String attribute) {
        Elements elements = article.select(attribute);
        if (elements.isEmpty()) {
            return "";
        } else {
            return elements.first().text();
        }
    }

    @NonNull
    private String extractDates(@NonNull Element article) {
        StringBuilder builder = new StringBuilder();
        Elements datePublished = article.select("[itemprop='datePublished']");
        if (!datePublished.isEmpty()) {
            builder.append("Publié le ")
                    .append(datePublished.first().text());
        }
        Elements dateModified = article.select("[itemprop='dateModified']");
        if (!dateModified.isEmpty()) {
            builder.append(", modifié le ")
                    .append(dateModified.first().text());
        }
        return builder.toString();
    }
}
