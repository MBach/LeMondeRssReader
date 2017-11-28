package org.mbach.lemonde.article;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.design.widget.AppBarLayout;
import android.support.design.widget.CollapsingToolbarLayout;
import android.support.design.widget.Snackbar;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.CardView;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.Toolbar;
import android.text.Html;
import android.transition.Slide;
import android.util.Log;
import android.util.TypedValue;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
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

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;
import org.mbach.lemonde.home.MainActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * ArticleActivity class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class ArticleActivity extends AppCompatActivity {

    private static final String TAG = "ArticleActivity";
    private static final String ATTR_HEADLINE = "Headline";
    private static final String ATTR_DESCRIPTION = "description";
    private static final String ATTR_AUTHOR = "author";
    private static final String TAG_TRUE = "vrai";
    private static final String TAG_FAKE = "faux";
    private static final String TAG_MOSTLY_TRUE = "plutot_vrai";
    private static final String TAG_FORGOTTEN = "oubli";
    private static RequestQueue REQUEST_QUEUE = null;

    private ExtendedFabButton fab;
    private ProgressBar autoLoader;
    private String commentsURI;
    private final ArticleAdapter articleAdapter = new ArticleAdapter();
    private boolean autoloadComments;

    private String shareText;
    private String shareLink;

    private void initActivityTransitions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Slide transition = new Slide();
            transition.excludeTarget(android.R.id.statusBarBackground, true);
            getWindow().setEnterTransition(transition);
            getWindow().setReturnTransition(transition);
        }
    }

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
        //initActivityTransitions();
        ThemeUtils.applyTheme(this, getTheme());
        setContentView(R.layout.activity_article);
        setTitle("");
        //ViewCompat.setTransitionName(findViewById(R.id.articleAppBarLayout), "transition_open_article");
        //supportPostponeEnterTransition();

        final LinearLayoutManager linearLayoutManager = new LinearLayoutManager(this);
        RecyclerView recyclerView = findViewById(R.id.articleActivityRecyclerView);
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
            public void onOffsetChanged(AppBarLayout appBarLayout, int verticalOffset) {
                TextView tagArticle = findViewById(R.id.tagArticle);
                if (tagArticle.isShown()) {
                    collapsingToolbar.setCollapsedTitleTextColor(getResources().getColor(R.color.primary_dark));
                }
            }
        });

        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        autoloadComments = sharedPreferences.getBoolean("autoloadComments", true);
        if (autoloadComments) {
            autoLoader = findViewById(R.id.autoLoader);
        } else {
            fab = findViewById(R.id.fab);
            //initFabTransitions();
            fab.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    if (Constants.BASE_URL2.equals(commentsURI)) {
                        fab.showProgress(false);
                        Snackbar.make(findViewById(R.id.coordinatorArticle), getString(R.string.no_more_comments_to_load), Snackbar.LENGTH_LONG).show();
                    } else {
                        fab.showProgress(true);
                        REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, commentsURI, commentsReceived, errorResponse));
                    }
                }
            });
        }
        recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(RecyclerView recyclerView, int dx, int dy) {
                if (linearLayoutManager.findLastCompletelyVisibleItemPosition() == recyclerView.getLayoutManager().getItemCount() - 1) {
                    if (autoloadComments) {
                        if (Constants.BASE_URL2.equals(commentsURI)) {
                            autoLoader.setVisibility(View.INVISIBLE);
                            Snackbar.make(findViewById(R.id.coordinatorArticle), getString(R.string.no_more_comments_to_load), Snackbar.LENGTH_LONG).show();
                        } else {
                            autoLoader.setVisibility(View.VISIBLE);
                            REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, commentsURI, commentsReceived, errorResponse));
                        }
                    } else {
                        fab.show();
                    }
                } else {
                    if (autoloadComments) {
                        autoLoader.setVisibility(View.INVISIBLE);
                    } else {
                        fab.hide();
                    }
                }
                super.onScrolled(recyclerView, dx, dy);
            }
        });

        // If user is opening a link from another App, like a mail client for instance
        final Intent intent = getIntent();
        final String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) {
            shareLink = intent.getDataString();
        } else if (getIntent().getExtras() != null) {
            collapsingToolbar.setTitle(getIntent().getExtras().getString(Constants.EXTRA_NEWS_CATEGORY));
            Picasso.with(this)
                    .load(getIntent().getExtras().getString(Constants.EXTRA_RSS_IMAGE))
                    .into((ImageView) findViewById(R.id.imageArticle));
            shareLink = getIntent().getExtras().getString(Constants.EXTRA_RSS_LINK);
        }

        // Start async job
        if (REQUEST_QUEUE == null) {
            REQUEST_QUEUE = Volley.newRequestQueue(this);
        }
        REQUEST_QUEUE.add(new StringRequest(Request.Method.GET, shareLink, articleReceived, errorResponse));
    }

    @Override
    public void onResume() {
        // Do not display the loader once again after resuming this activity
        if (articleAdapter.getItemCount() > 0) {
            ProgressBar articleLoader = findViewById(R.id.articleLoader);
            articleLoader.setVisibility(View.GONE);
        }
        super.onResume();
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        switch (id) {
            case android.R.id.home:
                if (Intent.ACTION_VIEW.equals(getIntent().getAction())) {
                    startActivity(new Intent(getApplicationContext(), MainActivity.class));
                } else {
                    onBackPressed();
                }
                return true;
            default:
                return true;
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        boolean shareContent = sharedPreferences.getBoolean("shareOnSocialNetworks", true);
        if (shareContent) {
            getMenuInflater().inflate(R.menu.articleactivity_right_menu, menu);
            menu.findItem(R.id.action_share).setOnMenuItemClickListener(new MenuItem.OnMenuItemClickListener() {
                @Override
                public boolean onMenuItemClick(MenuItem menuItem) {
                    Log.d(TAG, "MENU ?");
                    Intent shareIntent = new Intent();
                    shareIntent.setAction(Intent.ACTION_SEND);
                    shareIntent.putExtra(Intent.EXTRA_TEXT, shareText + " " + shareLink);
                    shareIntent.setType("text/plain");
                    startActivity(Intent.createChooser(shareIntent, getResources().getText(R.string.share_article)));
                    return false;
                }
            });
        }
        return true;
    }

    public void openTweet(View view) {
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

    /**
     * This listener is a callback which can parse and extract the HTML page that has been received after
     * an asynchronous call to the web. Jsoup library is used to parse the response and not to make the call.
     * Otherwise, a NetworkOnMainThreadException will be fired by the system.
     */
    private final Response.Listener<String> articleReceived = new Response.Listener<String>() {
        @Override
        public void onResponse(String response) {
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
            List<Model> items;
            Element content = doc.getElementById("content");
            if (content != null) {
                items = extractBlogArticle(content);
                setTagInHeader(R.string.blog_article, R.color.accent_complementary, Color.WHITE);
            } else {
                Elements category = doc.select("div.tt_rubrique_ombrelle");
                if (atLeastOneChild(category)) {
                    Log.d(TAG, "Cat: " + category.text());
                    setTitle(category.text());
                }
                Elements articles = doc.getElementsByTag("article");
                Element largeFormat = doc.getElementById("hors_format");
                if (largeFormat != null) {
                    items = new ArrayList<>();
                    setTagInHeader(R.string.large_article, R.color.primary_dark, Color.WHITE);
                } else if (articles.isEmpty()) {
                    // Video
                    items = extractVideo(doc);
                    setTagInHeader(R.string.video_article, R.color.accent_complementary, Color.WHITE);
                } else {
                    // Standard article
                    items = extractStandardArticle(articles);
                    // Full article is restricted to paid members
                    if (doc.getElementById("teaser_article") != null) {
                        CollapsingToolbarLayout collapsingToolbar = findViewById(R.id.collapsing_toolbar);
                        collapsingToolbar.setContentScrimResource(R.color.accent);
                        setTagInHeader(R.string.paid_article, R.color.accent, Color.BLACK);

                        if (getSupportActionBar() != null) {
                            final Drawable upArrow = getResources().getDrawable(R.drawable.ic_arrow_back_black_24dp);
                            getSupportActionBar().setHomeAsUpIndicator(upArrow);
                        }
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
                }
            }
            articleAdapter.insertItems(items);
            ProgressBar progressBar = findViewById(R.id.articleLoader);
            progressBar.setVisibility(View.GONE);
        }
    };

    /**
     * This helper method is used to customize the header (in the AppBar) to display a tag or a bubble when the current
     * article comes from an hosted blog, or is restricted to paid members.
     *
     * @param stringId string to display in the AppBar
     * @param backgroundColor color of the background
     * @param textColor color of the text to display
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
            int defaultText = ThemeUtils.getStyleableColor(ArticleActivity.this, R.styleable.CustomTheme_defaultText);

            List<Model> items = new ArrayList<>();
            // Extract header
            Elements header = commentDoc.select("[itemprop='InteractionCount']");
            if (atLeastOneChild(header)) {
                TextView commentHeader = new TextView(ArticleActivity.this);
                commentHeader.setText(String.format("Commentaires %s", header.text()));
                commentHeader.setTypeface(null, Typeface.BOLD);
                commentHeader.setTextColor(defaultText);
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
                    author.setTextColor(defaultText);

                    Elements commentComment = refs.next();
                    if (atLeastOneChild(commentComment)) {
                        TextView content = new TextView(ArticleActivity.this);
                        content.setText(commentComment.first().text());
                        content.setTextColor(defaultText);
                        if (comment.hasClass("reponse")) {
                            author.setPadding(Constants.PADDING_COMMENT_ANSWER, 0, 0, 12);
                            content.setPadding(Constants.PADDING_COMMENT_ANSWER, 0, 0, 16);
                        } else {
                            author.setPadding(0, 0, 0, 12);
                            content.setPadding(0, 0, 0, 16);
                        }
                        Integer commentId = Integer.valueOf(comment.attr("data-reaction_id"));
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
            articleAdapter.insertItems(items);
            if (autoloadComments) {

            } else {
                fab.showProgress(false);
            }
        }
    };

    /**
     * See @articleReceived field.
     */
    private final Response.ErrorListener errorResponse = new Response.ErrorListener() {
        @Override
        public void onErrorResponse(VolleyError error) {
            Log.e(TAG, "onErrorResponse", error);
        }
    };

    /**
     * Check if elements has at least one child.
     * This helper is useful because Elements.select() returns a collection of nodes.
     *
     * @param elements nodes to check
     * @return true if elements can be safely called with first()
     */
    private boolean atLeastOneChild(Elements elements) {
        return elements != null && !elements.isEmpty();
    }

    /**
     * Extract and parse a standard article. A standard article is published on the main page and by definition,
     * is not: from a hosted blog, nor a video, nor a special multimedia content. It has some standardized fields like
     * one (or multiple) author(s), a date, a description, an headline, a description and a list of paragraphs.
     * Each paragraph is a block of text (comments included) or an image or an embedded tweet.
     *
     * @param articles article to analyze
     * @return a list of formatted content that can be nicely displayed in the recycler view.
     */
    @NonNull
    private List<Model> extractStandardArticle(@NonNull Elements articles) {
        TextView headLine = new TextView(this);
        TextView authors = new TextView(this);
        TextView dates = new TextView(this);
        TextView description = new TextView(this);

        int defaultText = ThemeUtils.getStyleableColor(this, R.styleable.CustomTheme_defaultText);
        int authorDateText = ThemeUtils.getStyleableColor(this, R.styleable.CustomTheme_authorDateText);

        headLine.setTextColor(defaultText);
        description.setTextColor(defaultText);
        authors.setTextColor(authorDateText);
        dates.setTextColor(authorDateText);

        headLine.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_headline));
        authors.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_authors));
        dates.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_authors));
        description.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_description));

        Element article = articles.first();
        headLine.setText(extractAttr(article, ATTR_HEADLINE));
        authors.setText(extractAttr(article, ATTR_AUTHOR));
        dates.setText(extractDates(article));
        shareText = extractAttr(article, ATTR_DESCRIPTION);
        description.setText(shareText);

        List<Model> views = new ArrayList<>();
        views.add(new Model(headLine));
        views.add(new Model(authors));
        views.add(new Model(dates));
        views.add(new Model(description));
        views.addAll(extractParagraphs(article));
        return views;
    }

    /**
     * This method is not functionnal at this moment.
     *
     * @param doc the document to analyze
     * @return a list of formatted content that can be nicely displayed in the recycler view.
     */
    @NonNull
    private List<Model> extractVideo(@NonNull Document doc) {
        Elements elements = doc.select("section.video");
        if (elements.isEmpty()) {
            return new ArrayList<>();
        }

        TextView headLine = new TextView(this);
        TextView authors = new TextView(this);
        TextView dates = new TextView(this);
        TextView content = new TextView(this);

        int defaultText = ThemeUtils.getStyleableColor(this, R.styleable.CustomTheme_defaultText);
        int authorDateText = ThemeUtils.getStyleableColor(this, R.styleable.CustomTheme_authorDateText);

        headLine.setTextColor(defaultText);
        content.setTextColor(defaultText);
        authors.setTextColor(authorDateText);
        dates.setTextColor(authorDateText);

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
            for (Element e : els) {
                Log.d(TAG, e.html());
            }
            els.select("h2").remove();
            els.select("span.txt_gris_soutenu").remove();
            els.select("#recos_videos_outbrain").remove();
            fromHtml(content, els.html());
        }
        List<Model> views = new ArrayList<>();
        views.add(new Model(headLine));
        views.add(new Model(authors));
        views.add(new Model(dates));
        views.add(new Model(content));


        return views;
    }

    private void fromHtml(TextView textView, String html) {
        if (android.os.Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            textView.setText(Html.fromHtml(html));
        } else {
            textView.setText(Html.fromHtml(html, Html.FROM_HTML_MODE_COMPACT));
        }
    }

    /**
     * See {@link ArticleActivity extractStandardArticle}.
     *
     * @param content the document to analyze
     * @return a list of formatted content that can be nicely displayed in the recycler view.
     */
    @NonNull
    private List<Model> extractBlogArticle(@NonNull Element content) {
        Log.d(TAG, "extractBlog");
        TextView headLine = new TextView(this);
        TextView dates = new TextView(this);

        int defaultText = ThemeUtils.getStyleableColor(this, R.styleable.CustomTheme_defaultText);
        int authorDateText = ThemeUtils.getStyleableColor(this, R.styleable.CustomTheme_authorDateText);

        headLine.setTextColor(defaultText);
        dates.setTextColor(authorDateText);

        headLine.setTextSize(getResources().getDimension(R.dimen.article_headline));
        dates.setTextSize(getResources().getDimension(R.dimen.article_authors));

        Elements elements = content.select(".entry-title");
        Log.d(TAG, content.html());
        if (atLeastOneChild(elements)) {
            Log.d(TAG, "extractBlog headLine ! " + elements.first().text());
            headLine.setText(elements.first().text());
        }

        elements = content.select(".entry-date");
        if (atLeastOneChild(elements)) {
            Log.d(TAG, "extractBlog dates ! " + elements.first().text());
            dates.setText(elements.first().text());
        }
        List<Model> views = new ArrayList<>();
        views.add(new Model(headLine));
        views.add(new Model(dates));
        Log.d(TAG, "extractBlog headLine: " + headLine.getText());
        Log.d(TAG, "extractBlog dates: " + dates.getText());

        elements = content.select(".entry-content");
        if (atLeastOneChild(elements)) {
            Element element = elements.first();
            Log.d(TAG, "extractBlog content: " + element.children().size());

            for (int i = 0; i < element.children().size(); i++) {
                Element child = element.children().get(i);
                TextView textView = new TextView(this);
                textView.setText(child.text());
                textView.setPadding(0, 0, 0, Constants.PADDING_BOTTOM);
                textView.setTextColor(defaultText);
                textView.setTextSize(getResources().getDimension(R.dimen.article_body));
                views.add(new Model(textView));
            }
        }
        Log.d(TAG, "extractBlog: " + views.size());
        return views;
    }

    @NonNull
    private String extractAttr(@NonNull Element article, String attribute) {
        Elements elements = article.select("[itemprop='" + attribute + "']");
        if (elements.isEmpty()) {
            return "";
        } else {
            return elements.first().text();
        }
    }

    @NonNull
    private String extractDates(@NonNull Element article) {
        StringBuilder builder = new StringBuilder("");
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

    @NonNull
    private List<Model> extractParagraphs(@NonNull Element article) {
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        boolean displayTweets = sharedPreferences.getBoolean("displayTweets", false);

        int defaultText = ThemeUtils.getStyleableColor(this, R.styleable.CustomTheme_defaultText);

        List<Model> p = new ArrayList<>();
        Elements articleBody = article.select("[itemprop='articleBody']");
        if (articleBody.isEmpty()) {
            return p;
        }
        Element body = articleBody.first();
        Elements elements = body.children();
        for (int i = 0; i < elements.size(); i++) {
            Element element = elements.get(i);
            // Ignore "À lire" ("Read also") parts which don't add much information on mobile phones
            if (element.hasClass("lire")) {
                continue;
            }

            Elements figures = element.getElementsByTag("figure");
            // Text or figure ?
            if (figures.isEmpty()) {

                if (element.is("div.snippet.multimedia-embed")) {
                    // Parse graphs if possible, otherwise just ignore this multimedia snippet
                    boolean hasGraph = !element.select("div.graphe").isEmpty();
                    boolean hasScript = !element.select("script").isEmpty();
                    if (hasGraph && hasScript) {
                        GraphExtractor graphExtractor = new GraphExtractor(this, element.select("script").html());
                        Chart graph = graphExtractor.generate();
                        if (graph != null) {
                            p.add(new Model(GraphExtractor.getModelType(graph), graph));
                        }
                    }
                    continue;
                }

                if (element.is("blockquote.twitter-tweet")) {
                    if (displayTweets) {
                        TextView content = new TextView(this);
                        fromHtml(content, element.html());
                        Button link = new Button(this);
                        Elements links = element.select("a[href]");
                        if (atLeastOneChild(links)) {
                            link.setContentDescription("https:" + links.first().attr("href"));
                        }
                        CardView cardView = new CardView(this);
                        cardView.addView(content);
                        cardView.addView(link);
                        p.add(new Model(Model.TWEET_TYPE, cardView));
                    }
                    continue;
                }

                // Cleanup hyperlink and keep only the value
                element.select("a[href]").unwrap();

                // Cleanup style markup and script which should be placed on top
                if (element.is("style")) {
                    element.remove();
                    continue;
                }
                if (element.is("script")) {
                    element.remove();
                    continue;
                }

                TextView t = new TextView(this);
                fromHtml(t, element.html());
                t.setTextColor(defaultText);

                boolean hasIntertitre = element.is("h2.intertitre");
                if (!hasIntertitre) {
                    hasIntertitre = !element.select("h2.intertitre").isEmpty();
                }

                if (hasIntertitre) {
                    t.setTypeface(Typeface.SERIF);
                    t.setPadding(0, Constants.PADDING_TOP_SUBTITLE, 0, Constants.PADDING_BOTTOM_SUBTITLE);
                    t.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_description));
                } else {
                    t.setPadding(0, 0, 0, Constants.PADDING_BOTTOM);
                    t.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_body));
                }

                if (element.is("p.question")) {
                    t.setTypeface(null, Typeface.BOLD);
                }

                if (element.is("h2.tag") && element.children().size() > 0) {
                    String cssClass = element.child(0).attr("class");
                    Log.d(TAG, cssClass);
                    t.setAllCaps(true);
                    RecyclerView.LayoutParams lp = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                    t.setLayoutParams(lp);
                    t.setPadding(Constants.PADDING_LEFT_RIGHT_TAG, Constants.PADDING_BOTTOM, Constants.PADDING_LEFT_RIGHT_TAG, Constants.PADDING_BOTTOM);
                    switch (cssClass) {
                        case TAG_FAKE:
                            t.setBackgroundColor(ContextCompat.getColor(getBaseContext(), R.color.tag_red));
                            break;
                        case TAG_TRUE:
                            t.setBackgroundColor(ContextCompat.getColor(getBaseContext(), R.color.tag_green));
                            break;
                        case TAG_MOSTLY_TRUE:
                            t.setBackgroundColor(ContextCompat.getColor(getBaseContext(), R.color.tag_yellow));
                            break;
                        case TAG_FORGOTTEN:
                            t.setBackgroundColor(ContextCompat.getColor(getBaseContext(), R.color.tag_grey));
                            break;
                        default:
                            break;
                    }
                }
                p.add(new Model(t));

            } else {
                // If image is on first position in the DOM, it's useless to display once more: it's already displayed in the toolbar
                if (i > 0) {
                    Element figure = figures.first();
                    Elements images = figure.getElementsByTag("img");
                    if (!images.isEmpty()) {
                        p.add(new Model(Model.IMAGE_TYPE, images.first().attr("src")));
                    }
                }
            }
        }
        return p;
    }
}
