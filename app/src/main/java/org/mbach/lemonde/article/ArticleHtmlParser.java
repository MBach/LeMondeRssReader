package org.mbach.lemonde.article;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Typeface;
import android.os.Build;
import android.preference.PreferenceManager;
import android.text.Html;
import android.util.TypedValue;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;

import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.mbach.lemonde.Constants;
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;

import java.util.ArrayList;

public class ArticleHtmlParser {

    private final Context context;

    public ArticleHtmlParser(Context context) {
        this.context = context;
    }

    /**
     * Parse an article from an HTML Document.
     *
     * @param doc the document
     * @return ArrayList<Model>
     */
    public ArrayList<Model> parse(Document doc) {
        if (this.isLive(doc)) {
            return this.parseLive(doc);
        }
        if (this.isLongForm(doc)) {
            return this.parseLongForm(doc);
        }
        return this.parseArticle(doc);
    }

    private boolean isLive(Document doc) {
        return doc.select(".live__hero").size() > 0;
    }

    private boolean isLongForm(Document doc) {
        return doc.select(".article--longform").size() > 0;
    }

    private ArrayList<Model> parseLive(Document doc) {
        ArrayList<Model> models = new ArrayList<>();

        models.add(buildHeadline(doc, ".title .title--live"));
        models.add(buildDescription(doc, ".title .summary--live"));

        Elements articleElems = doc.select("#post-container .post");
        for (Element elem : articleElems) {
            models.add(buildLive(elem));
        }

        return models;
    }

    private ArrayList<Model> parseLongForm(Document doc) {
        ArrayList<Model> models = new ArrayList<>();

        models.add(buildHeadline(doc, ".article__heading .article__title"));
        models.add(buildDescription(doc, ".article__heading .article__desc"));
        models.add(buildAuthor(doc, ".article__heading .meta__authors"));
        models.add(buildDate(doc, ".article__heading .meta__publisher"));
        models.add(buildReadTime(doc, ".article__heading .meta__reading-time"));

        Elements articleElems = doc.select(".article__content > *");
        for (Element elem : articleElems) {
            // Image
            if (elem.tagName().equals("figure")) {
                String imgSrc = elem.select("img").attr("src");
                if (!imgSrc.equals("")) {
                    models.add(new Model(Model.IMAGE_TYPE, imgSrc, 0));
                }
            }
            // Subtitle
            else if (elem.tagName().equals("h2")) {
                TextView paragraph = new TextView(context);
                fromHtml(paragraph, elem.text());
                paragraph.setTypeface(Typeface.SERIF);
                paragraph.setPadding(0, Constants.PADDING_TOP_SUBTITLE, 0, Constants.PADDING_BOTTOM_SUBTITLE);
                paragraph.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_description));
                models.add(new Model(paragraph, Model.TEXT_TYPE));
            }
            // Paragraph
            else if (elem.hasClass("article__paragraph") |
                    elem.hasClass("article__status") |
                    elem.hasClass("article__cite")) {
                models.add(buildParagraph(elem));
            }
            // Tweets
            else if (elem.hasClass("twitter-tweet")) {
                SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
                boolean displayTweets = sharedPreferences.getBoolean("displayTweets", false);

                if (displayTweets) {
                    TextView t = new TextView(context);
                    fromHtml(t, elem.html());
                    Button link = new Button(context);
                    Elements links = elem.select("a[href]");
                    if (ArticleActivity.atLeastOneChild(links)) {
                        link.setContentDescription("http://" + links.first().attr("href").replaceAll("^//", ""));
                    }
                    CardView cardView = new CardView(context);
                    cardView.addView(t);
                    cardView.addView(link);
                    models.add(new Model(Model.TWEET_TYPE, cardView, 0));
                }
            }
        }

        return models;
    }

    private ArrayList<Model> parseArticle(Document doc) {
        ArrayList<Model> models = new ArrayList<>();

        models.add(buildHeadline(doc, ".article__header .article__title"));
        models.add(buildDescription(doc, ".article__header .article__desc"));
        models.add(buildAuthor(doc, ".article__header .meta__author"));
        models.add(buildDate(doc, ".article__header .meta__date"));
        models.add(buildReadTime(doc, ".article__header .meta__reading-time"));

        Elements articleElems = doc.select(".article__content > *");
        for (Element elem : articleElems) {
            // Image
            if (elem.tagName().equals("figure")) {
                String imgSrc = elem.select("img").attr("src");
                if (!imgSrc.equals("")) {
                    models.add(new Model(Model.IMAGE_TYPE, imgSrc, 0));
                }
            }
            // Subtitle
            else if (elem.tagName().equals("h2")) {
                TextView paragraph = new TextView(context);
                fromHtml(paragraph, elem.text());
                paragraph.setTypeface(Typeface.SERIF);
                paragraph.setPadding(0, Constants.PADDING_TOP_SUBTITLE, 0, Constants.PADDING_BOTTOM_SUBTITLE);
                paragraph.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_description));
                models.add(new Model(paragraph, Model.TEXT_TYPE));
            }
            // Paragraph
            else if (elem.hasClass("article__paragraph") |
                    elem.hasClass("article__status") |
                    elem.hasClass("article__cite")) {
                models.add(buildParagraph(elem));
            }
            // Tweets
            else if (elem.hasClass("twitter-tweet")) {
                SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
                boolean displayTweets = sharedPreferences.getBoolean("displayTweets", false);

                if (displayTweets) {
                    TextView t = new TextView(context);
                    fromHtml(t, elem.html());
                    Button link = new Button(context);
                    Elements links = elem.select("a[href]");
                    if (ArticleActivity.atLeastOneChild(links)) {
                        link.setContentDescription("http://" + links.first().attr("href").replaceAll("^//", ""));
                    }
                    CardView cardView = new CardView(context);
                    cardView.addView(t);
                    cardView.addView(link);
                    models.add(new Model(Model.TWEET_TYPE, cardView, 0));
                }
            }
        }

        return models;
    }

    private Model buildHeadline(Document doc, String cssQuery) {
        TextView headLine = new TextView(context);
        headLine.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_headline));
        fromHtml(headLine, doc.select(cssQuery).html());
        return new Model(headLine);
    }

    private Model buildDescription(Document doc, String cssQuery) {
        TextView description = new TextView(context);
        description.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_description));
        fromHtml(description, doc.select(cssQuery).html());
        return new Model(description);
    }

    private Model buildAuthor(Document doc, String cssQuery) {
        TextView authors = new TextView(context);
        authors.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_authors));
        authors.setText(doc.select(cssQuery).text());
        return new Model(authors);
    }

    private Model buildDate(Document doc, String cssQuery) {
        TextView dates = new TextView(context);
        dates.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_authors));
        dates.setText(doc.select(cssQuery).text());
        return new Model(dates);
    }

    private Model buildReadTime(Document doc, String cssQuery) {
        TextView readTime = new TextView(context);
        readTime.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_description));
        doc.select(cssQuery).select("span.sr-only").remove();
        readTime.setText(doc.select(cssQuery).text());
        return new Model(Model.TEXT_AND_ICON_TYPE, readTime,  ThemeUtils.isDarkTheme(this.context) ? R.drawable.baseline_timer_white_24 : R.drawable.baseline_timer_black_24);
    }

    private Model buildParagraph(Element elem) {
        String par = elem.html();
        // Deleting links
        par = par.replaceAll("<a[^>]*>", "");
        TextView paragraph = new TextView(context);
        fromHtml(paragraph, par);
        paragraph.setPadding(0, 0, 0, Constants.PADDING_BOTTOM);
        paragraph.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.article_body));

        return new Model(paragraph, Model.TEXT_TYPE);
    }

    private Model buildLive(Element elem) {
        LiveModel model = new LiveModel();
        model.setAuthorName(elem.select(".info-content .creator-name").text());
        model.setDate(elem.select(".info-content .date").text());
        model.setAuthorAvatar(elem.select(".creator-avatar img").attr("src"));

        Elements contents = elem.select(".content--live");
        for (Element content : contents) {
            ArrayList<LiveModel.SubModel> subModels = this.buildSubLive(content, model);
            model.addSubModels(subModels);
        }

        return model;
    }

    private ArrayList<LiveModel.SubModel> buildSubLive(Element elem, LiveModel model) {
        ArrayList<LiveModel.SubModel> subModels = new ArrayList<>();

        if (elem.select("> div").size() == 0) {
            if (!elem.text().equals("")) {
                subModels.add(model.buildParagraph(elem.html()));
            }
            if ("img".equals(elem.tagName())) {
                subModels.add(model.buildImage(elem.attr("src")));
            }
            if (elem.select("> strong img").size() == 1) {
                subModels.add(model.buildImage(elem.select("> strong img").first().attr("src")));
            }
        } else {
            for (Element subElem : elem.children()) {
                subModels.addAll(this.buildSubLive(subElem, model));
            }
        }

        /*
        if(elem.is("img")) {
            subModels.add(model.buildImage(elem.attr("src")));
            Log.d("parse", "addImg "+elem.attr("src"));
        }
        else if(elem.is("blockquote")) {
            subModels.add(model.buildQuote(elem.html()));
            Log.d("parse", "addQuote "+elem.html());
        }
        else if(elem.is("div")) {
            if(elem.select("> div").size() == 0 &&
                    elem.select("> blockquote").size() == 0 &&
                    elem.select("> img").size() == 0) {
                subModels.add(model.buildParagraph(elem.html()));
                Log.d("parse", "addPar "+elem.html());
            }
            else {
                Elements subContents = elem.select("> *");
                for(Element subContent : subContents) {
                    subModels.addAll(this.buildSubLive(subContent, model));
                }
            }
        }
        else if(elem.is("a")) {
            Elements subContents = elem.children();
            for(Element subContent : subContents) {
                subModels.addAll(this.buildSubLive(subContent, model));
            }
        }
        */

        return subModels;
    }

    /**
     * fromHtml to deal with older SDK.
     *
     * @param textView the textView to fill
     * @param html     raw string
     */
    private void fromHtml(@NonNull TextView textView, String html) {
        if (html == null) {
            return;
        }
        if (android.os.Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            textView.setText(Html.fromHtml(html));
        } else {
            textView.setText(Html.fromHtml(html, Html.FROM_HTML_MODE_COMPACT));
        }
    }

}
