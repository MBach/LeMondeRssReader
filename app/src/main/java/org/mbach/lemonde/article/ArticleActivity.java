package org.mbach.lemonde.article;

import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.design.widget.AppBarLayout;
import android.support.design.widget.CollapsingToolbarLayout;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.CardView;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.Toolbar;
import android.text.Html;
import android.text.Layout;
import android.transition.Slide;
import android.util.Log;
import android.util.TypedValue;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import com.github.jorgecastilloprz.FABProgressCircle;
import com.squareup.picasso.Picasso;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;
import org.mbach.lemonde.home.MainActivity;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * ArticleActivity class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class ArticleActivity extends AppCompatActivity implements ScrollFeedbackRecyclerView.Callbacks {

    private static final String TAG = "ArticleActivity";

    private AppBarLayout appBarLayout;
    private Toolbar toolbar;
    private FABProgressCircle fabProgressCircle;
    private String commentsURI;
    private ScrollFeedbackRecyclerView articleActivityRecyclerView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initActivityTransitions();
        setContentView(R.layout.activity_article);
        appBarLayout = (AppBarLayout) findViewById(R.id.app_bar_layout);
        toolbar = (Toolbar) findViewById(R.id.toolbar);

        articleActivityRecyclerView = (ScrollFeedbackRecyclerView) findViewById(R.id.articleActivityRecyclerView);
        articleActivityRecyclerView.setLayoutManager(new LinearLayoutManager(this));

        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fabProgressCircle = (FABProgressCircle) findViewById(R.id.fabProgressCircle);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View view) {
                fabProgressCircle.show();
                List<Model> comments = loadMoreComments();
                fabProgressCircle.hide();

                if (comments.isEmpty()) {
                    Snackbar.make(findViewById(R.id.coordinatorArticle), "Pas de nouveau commentaire", Snackbar.LENGTH_LONG).show();
                } else {
                    ArticleAdapter adapter = (ArticleAdapter) articleActivityRecyclerView.getAdapter();
                    adapter.insertItems(comments);
                }
            }
        });

        //ViewCompat.setTransitionName(appBarLayout, Constants.EXTRA_RSS_IMAGE);
        //supportPostponeEnterTransition();

        Bundle extras = getIntent().getExtras();

        if (extras != null) {
            CollapsingToolbarLayout collapsingToolbar = (CollapsingToolbarLayout) findViewById(R.id.collapsing_toolbar);
            collapsingToolbar.setTitle(extras.getString(Constants.EXTRA_NEWS_CATEGORY));

            final ImageView imageView = (ImageView) findViewById(R.id.imageArticle);
            Picasso.with(getBaseContext()).load(extras.getString(Constants.EXTRA_RSS_IMAGE)).into(imageView);
            //Bitmap bmp = extras.getParcelable(Constants.EXTRA_RSS_IMAGE_BITMAP);
            //imageView.setImageBitmap(bmp);

            try {
                Document doc = Jsoup.connect(extras.getString(Constants.EXTRA_RSS_LINK)).get();
                if (doc.getElementById("teaser_article") != null) {
                    TextView paidArticle = (TextView) findViewById(R.id.paidArticle);
                    paidArticle.setVisibility(View.VISIBLE);
                }
                Elements articles = doc.getElementsByTag("article");
                List<Model> items = null;
                if (!articles.isEmpty()) {
                    Elements category = doc.select("div.tt_rubrique_ombrelle");
                    if (atLeastOneChild(category)) {
                        getSupportActionBar().setTitle(category.text());
                    }
                    items = extractStandardArticle(articles);
                    items.addAll(loadAndExtractCommentPreview(doc.getElementById("liste_reactions")));
                } else if (doc.getElementById("content") != null) {
                    items = extractBlogArticle(doc);
                }
                if (items != null && !items.isEmpty()) {
                    articleActivityRecyclerView.setAdapter(new ArticleAdapter(items));
                }
            } catch (IOException e) {
                Log.d(TAG, e.getMessage());
            }
        }
    }

    private List<Model> loadAndExtractCommentPreview(@NonNull Element rootComments) {
        Elements dataAjURI = rootComments.select("[^data-aj-uri]");
        if (atLeastOneChild(dataAjURI)) {
            try {
                String commentPreviewURI = Constants.BASE_URL2 + dataAjURI.first().attr("data-aj-uri");
                Document docComments = Jsoup.connect(commentPreviewURI).get();
                return extractComments(docComments, false);
            } catch (IOException e) {
                Log.d(TAG, "no comments?" + e.getMessage());
            }
        }
        return new ArrayList<>();
    }

    private boolean atLeastOneChild(Elements elements) {
        return elements != null && !elements.isEmpty();
    }

    private List<Model> extractComments(Element doc, boolean loadMoreComments) {

        List<Model> commentList = new ArrayList<>();

        // Extract header
        if (!loadMoreComments) {
            Elements header = doc.select("[itemprop='InteractionCount']");
            if (atLeastOneChild(header)) {
                TextView commentHeader = new TextView(getBaseContext());
                commentHeader.setText(String.format("Commentaires %s", header.text()));
                commentHeader.setTypeface(null, Typeface.BOLD);
                commentHeader.setTextColor(Color.WHITE);
                commentHeader.setPadding(0, 0, 0, Constants.PADDING_COMMENT_ANSWER);
                commentList.add(new Model(commentHeader, 0));
            }
        }

        // Extract comments
        Elements comments = doc.select("[itemprop='commentText']");
        for (Element comment : comments) {
            Elements refs = comment.select("p.references");
            if (atLeastOneChild(refs)) {
                // Clear date
                refs.select("span").remove();
                TextView author = new TextView(getBaseContext());
                author.setTypeface(null, Typeface.BOLD);
                author.setText(refs.text());
                author.setTextColor(Color.WHITE);

                Elements commentComment = refs.next();
                if (atLeastOneChild(commentComment)) {
                    TextView content = new TextView(getBaseContext());
                    content.setText(commentComment.first().text());
                    content.setTextColor(Color.WHITE);
                    if (comment.hasClass("reponse")) {
                        author.setPadding(Constants.PADDING_COMMENT_ANSWER, 0, 0, 12);
                        content.setPadding(Constants.PADDING_COMMENT_ANSWER, 0, 0, 16);
                    } else {
                        author.setPadding(0, 0, 0, 12);
                        content.setPadding(0, 0, 0, 16);
                    }
                    Integer commentId = Integer.valueOf(comment.attr("data-reaction_id"));
                    commentList.add(new Model(author, commentId));
                    commentList.add(new Model(content, commentId));
                }
            }
        }
        // Extract full comments page URI
        Elements div = doc.select("div.reactions");

        if (atLeastOneChild(div)) {
            Element fullComments = div.first().nextElementSibling();
            Elements next = fullComments.select("a");
            if (atLeastOneChild(next)) {
                commentsURI = next.first().attr("href");
            }
        }
        return commentList;
    }

    private List<Model> loadMoreComments() {
        if (commentsURI != null && !commentsURI.isEmpty()) {
            try {
                Log.d(TAG, "loading more comments from " + Constants.BASE_URL2 + commentsURI);
                Document doc = Jsoup.connect(Constants.BASE_URL2 + commentsURI).get();
                return extractComments(doc.getElementById("liste_reactions"), true);
            } catch (IOException e) {
                Log.d(TAG, "not being able to retrieve comments?" + e.getMessage());
            }
        }
        return new ArrayList<>();
    }

    @NonNull
    private List<Model> extractStandardArticle(@NonNull Elements articles) {
        Element article = articles.first();
        TextView headLine = new TextView(getBaseContext());
        TextView authors = new TextView(getBaseContext());
        TextView dates = new TextView(getBaseContext());
        TextView description = new TextView(getBaseContext());

        headLine.setTextColor(Color.WHITE);
        authors.setTextColor(Color.GRAY);
        dates.setTextColor(Color.GRAY);
        description.setTextColor(Color.WHITE);

        headLine.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_headline));
        authors.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_authors));
        dates.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_authors));
        description.setTextSize(TypedValue.COMPLEX_UNIT_SP, getResources().getDimension(R.dimen.article_description));

        headLine.setText(extractHeadline(article));
        authors.setText(extractAuthors(article));
        dates.setText(extractDates(article));
        description.setText(extractDescription(article));

        List<Model> views = new ArrayList<>();
        views.add(new Model(headLine));
        views.add(new Model(authors));
        views.add(new Model(dates));
        views.add(new Model(description));
        views.addAll(extractParagraphs(article));
        return views;
    }

    @NonNull
    private List<Model> extractBlogArticle(@NonNull Document doc) {
        TextView headLine = new TextView(getBaseContext());
        TextView dates = new TextView(getBaseContext());

        headLine.setTextColor(Color.WHITE);
        dates.setTextColor(Color.GRAY);

        headLine.setTextSize(getResources().getDimension(R.dimen.article_headline));
        dates.setTextSize(getResources().getDimension(R.dimen.article_authors));

        Elements elements = doc.select("h1.entry-title");
        if (!elements.isEmpty()) {
            headLine.setText(elements.first().text());
        }

        elements = doc.select(".entry-date");
        if (!elements.isEmpty()) {
            dates.setText(elements.first().text());
        }
        List<Model> views = new ArrayList<>();
        views.add(new Model(headLine));
        views.add(new Model(dates));

        elements = doc.select(".entry-content");
        if (elements != null) {
            Element element = elements.first();
            for (int i = 0; i < element.children().size(); i++) {
                Element child = element.children().get(i);
                TextView textView = new TextView(getBaseContext());
                textView.setText(child.text());
                textView.setPadding(0, 0, 0, Constants.PADDING_BOTTOM);
                textView.setTextColor(Color.WHITE);
                textView.setTextSize(getResources().getDimension(R.dimen.article_body));
                views.add(new Model(textView));
            }
        }

        return views;
    }

    @NonNull
    private String extractHeadline(@NonNull Element article) {
        Elements elements = article.select("[itemprop='Headline']");
        if (elements.isEmpty()) {
            return "";
        } else {
            return elements.first().text();
        }
    }

    @NonNull
    private String extractDescription(@NonNull Element article) {
        Elements elements = article.select("[itemprop='description']");
        if (elements.isEmpty()) {
            return "";
        } else {
            return elements.first().text();
        }
    }

    @NonNull
    private String extractAuthors(@NonNull Element article) {
        Elements elements = article.select("[itemprop='author']");
        if (elements.isEmpty()) {
            return "";
        } else {
            return "Par " + elements.first().text();
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

                // Cleanup hyperlink and keep only the value
                element.select("a[href]").unwrap();

                if (element.is("div.snippet.multimedia-embed")) {
                    boolean hasGraph = !element.select("div.graphe").isEmpty();
                    boolean hasScript = !element.select("script").isEmpty();
                    if (hasGraph && hasScript) {
                        GraphExtractor graphExtractor = new GraphExtractor(getBaseContext(), element.select("script").first());
                        p.add(new Model(Model.GRAPH_TYPE, graphExtractor.generate()));
                        continue;
                    }
                }

                if (element.is("blockquote.twitter-tweet")) {
                    SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getBaseContext());
                    boolean displayTweets = sharedPreferences.getBoolean("displayTweets", false);

                    element.remove();
                    if (displayTweets) {
                        TextView t = new TextView(getBaseContext());
                        t.setText(Html.fromHtml(element.html(), Html.FROM_HTML_MODE_COMPACT));
                        t.setTextColor(Color.WHITE);

                        CardView cardView = new CardView(getBaseContext());
                        cardView.addView(t);
                        p.add(new Model(Model.TWEET_TYPE, cardView));
                    }
                    continue;
                }

                // Cleanup style markup and script which should be placed on top
                if (element.is("style")) {
                    element.remove();
                    continue;
                }
                if (element.is("script")) {
                    element.remove();
                    continue;
                }

                TextView t = new TextView(getBaseContext());
                t.setText(Html.fromHtml(element.html(), Html.FROM_HTML_MODE_COMPACT));
                t.setTextColor(Color.WHITE);

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
                    t.setPadding(Constants.PADDING_LEFT_RIGHT_TAG, Constants.PADDING_BOTTOM, Constants.PADDING_LEFT_RIGHT_TAG, Constants.PADDING_BOTTOM);
                    switch (cssClass) {
                        case "faux":
                            t.setBackgroundColor(getResources().getColor(R.color.tag_red, null));
                            break;
                        case "vrai":
                            t.setBackgroundColor(getResources().getColor(R.color.tag_green, null));
                            break;
                        case "plutot_vrai":
                            t.setBackgroundColor(getResources().getColor(R.color.tag_yellow, null));
                            break;
                        case "oubli":
                            t.setBackgroundColor(getResources().getColor(R.color.tag_grey, null));
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

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        switch (id) {
            case android.R.id.home:
                onBackPressed();
                return true;
            case R.id.action_settings:
                return true;
            default:
                return super.onOptionsItemSelected(item);
        }
    }

    private void initActivityTransitions() {
        Slide transition = new Slide();
        transition.excludeTarget(android.R.id.statusBarBackground, true);
        getWindow().setEnterTransition(transition);
        getWindow().setReturnTransition(transition);
    }

    @Override
    public boolean isAppBarCollapsed() {
        final int appBarVisibleHeight = (int) (appBarLayout.getY() + appBarLayout.getHeight());
        final int toolbarHeight = toolbar.getHeight();
        return (appBarVisibleHeight == toolbarHeight);
    }

    @Override
    public void setExpanded(boolean expanded) {
        appBarLayout.setExpanded(expanded, true);
    }
}
