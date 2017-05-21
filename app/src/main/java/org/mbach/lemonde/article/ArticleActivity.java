package org.mbach.lemonde.article;

import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.design.widget.AppBarLayout;
import android.support.design.widget.CollapsingToolbarLayout;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.Toolbar;
import android.text.Html;
import android.transition.Slide;
import android.util.Log;
import android.util.TypedValue;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import com.squareup.picasso.Picasso;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class ArticleActivity extends AppCompatActivity implements ScrollFeedbackRecyclerView.Callbacks {

    private static final String TAG = "ArticleActivity";

    private AppBarLayout mAppBarLayout;
    private Toolbar mToolbar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        initActivityTransitions();
        setContentView(R.layout.activity_article);

        ScrollFeedbackRecyclerView articleActivityRecyclerView = (ScrollFeedbackRecyclerView) findViewById(R.id.articleActivityRecyclerView);
        articleActivityRecyclerView.setLayoutManager(new LinearLayoutManager(this));

        mAppBarLayout = (AppBarLayout) findViewById(R.id.app_bar_layout);
        mToolbar = (Toolbar) findViewById(R.id.toolbar);

        setSupportActionBar(mToolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        Bundle extras = getIntent().getExtras();

        if (extras != null) {
            CollapsingToolbarLayout collapsingToolbar = (CollapsingToolbarLayout) findViewById(R.id.collapsing_toolbar);
            collapsingToolbar.setTitle(extras.getString(Constants.EXTRA_NEWS_CATEGORY));

            final ImageView imageView = (ImageView) findViewById(R.id.imageArticle);
            Picasso.with(this).load(extras.getString(Constants.EXTRA_RSS_IMAGE)).into(imageView);

            try {
                Document doc = Jsoup.connect(extras.getString(Constants.EXTRA_RSS_LINK)).get();
                if (doc.getElementById("teaser_article") != null) {

                }
                Elements articles = doc.getElementsByTag("article");

                List<Model> list = null;
                if (!articles.isEmpty()) {
                    list = extractStandardArticle(articles);
                    list.addAll(loadAndExtractCommentPreview(doc.getElementById("liste_reactions")));
                } else if (doc.getElementById("content") != null) {
                    list = extractBlogArticle(doc);
                }
                if (list != null && !list.isEmpty()) {
                    View lastEmptyView = new View(getBaseContext());
                    lastEmptyView.setPadding(0, 500, 0, 0);
                    list.add(new Model(Model.BLANK_TYPE, lastEmptyView));
                    articleActivityRecyclerView.setAdapter(new ArticleAdapter(list));
                }
            } catch (IOException e) {
                Log.d(TAG, e.getMessage());
            }
        }
    }

    @NonNull
    private List<Model> loadAndExtractCommentPreview(@NonNull Element rootComments) {
        List<Model> list = new ArrayList<>();
        Elements dataAjURI = rootComments.select("[^data-aj-uri]");
        Log.d(TAG, "dataAjURI ? " + dataAjURI);
        if (dataAjURI != null && !dataAjURI.isEmpty()) {
            try {
                String commentURI = Constants.BASE_URL2 + dataAjURI.first().attr("data-aj-uri");

                Document docComments = Jsoup.connect(commentURI).get();
                Elements comments = docComments.select("[itemprop='commentText']");

                for (Element comment : comments) {
                    Elements refs = comment.select("p.references");

                    if (refs != null && !refs.isEmpty()) {
                        // Clear date
                        refs.select("span").remove();
                        TextView author = new TextView(getBaseContext());
                        author.setTypeface(null, Typeface.BOLD);
                        author.setText(refs.text());
                        author.setTextColor(Color.WHITE);

                        Elements commentComment = refs.next();
                        if (commentComment != null && !commentComment.isEmpty()) {
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
                            list.add(new Model(author));
                            list.add(new Model(content));
                        }
                    }
                }
            } catch (IOException e) {
                Log.d(TAG, "no comments?" + e.getMessage());
            }
        }


        Log.d(TAG, "Comments ? " + list.size());
        return list;
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
            // On ignore les encarts "À lire" qui n'apportent pas grand chose
            if (element.hasClass("lire")) {
                continue;
            }

            Elements figures = element.getElementsByTag("figure");
            // Texte ou images ?
            if (figures.isEmpty()) {

                // Nettoyage des liens
                Elements links = element.select("a[href]");
                for (Element link : links) {
                    element.select("a").unwrap();
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
                p.add(new Model(t));

            } else {
                // Si l'image se trouve en première position dans le DOM il est inutile de la réafficher car elle se trouve déjà dans la Toolbar
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
                //NavUtils.navigateUpFromSameTask(this);
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
        final int appBarVisibleHeight = (int) (mAppBarLayout.getY() + mAppBarLayout.getHeight());
        final int toolbarHeight = mToolbar.getHeight();
        return (appBarVisibleHeight == toolbarHeight);
    }

    @Override
    public void setExpanded(boolean expanded) {
        mAppBarLayout.setExpanded(expanded, true);
    }
}
