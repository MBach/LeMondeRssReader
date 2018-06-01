package org.mbach.lemonde.home;

import android.support.annotation.NonNull;
import android.util.Log;
import android.util.Xml;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * RssParser class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class RssParser {

    private static final String TAG = "RssParser";

    private static final String TAG_TITLE = "title";
    private static final String TAG_LINK = "link";
    private static final String TAG_ENCLOSURE = "enclosure";
    private static final String TAG_RSS = "rss";
    private static final String TAG_ITEM = "item";
    private static final String TAG_GUID = "guid";
    private static Pattern ARTICLE_ID_PATTERN = Pattern.compile("/(\\d{6,10})/");

    @NonNull
    ArrayList<RssItem> parse(@NonNull String stream) {
        ArrayList<RssItem> items = null;
        try {
            XmlPullParser parser = Xml.newPullParser();
            parser.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false);
            parser.setInput(new StringReader(stream));
            parser.nextTag();
            parser.require(XmlPullParser.START_TAG, null, TAG_RSS);
            items = readFeed(parser);
        } catch (@NonNull XmlPullParserException | IOException e) {
            Log.w(e.getMessage(), e);
        } finally {
            if (items == null) {
                items = new ArrayList<>();
            }
        }
        return items;
    }

    /**
     * Read and analyze RSS feed.
     *
     * @param parser the XML parser with some objects to be classified
     * @return a list of well formed news that can be clicked later inside {@link org.mbach.lemonde.article.ArticleActivity}
     */
    @NonNull
    private ArrayList<RssItem> readFeed(@NonNull XmlPullParser parser) {
        ArrayList<RssItem> items = new ArrayList<>();
        RssItem item = new RssItem();
        String text = null;
        try {
            while (parser.next() != XmlPullParser.END_DOCUMENT) {

                String tagName = parser.getName();
                switch (parser.getEventType()) {
                    case XmlPullParser.START_TAG:
                        if (tagName.equalsIgnoreCase(TAG_ITEM)) {
                            item = new RssItem();
                        }
                        break;
                    case XmlPullParser.TEXT:
                        text = parser.getText();
                        break;
                    case XmlPullParser.END_TAG:
                        if (tagName.equalsIgnoreCase(TAG_ITEM)) {
                            items.add(item);
                        } else if (tagName.equalsIgnoreCase(TAG_LINK)) {
                            item.setLink(text);
                        } else if (tagName.equalsIgnoreCase(TAG_TITLE)) {
                            item.setTitle(text);
                        } else if (tagName.equalsIgnoreCase(TAG_GUID) && text != null) {
                            Matcher matcher = ARTICLE_ID_PATTERN.matcher(text);
                            if (matcher.find()) {
                                item.setArticleId(Integer.valueOf(matcher.group(1)));
                            } else {
                                item.setArticleId(0);
                            }
                        } else if (tagName.equalsIgnoreCase(TAG_ENCLOSURE)) {
                            text = parser.getAttributeValue(null, "url");
                            item.setEnclosure(text);
                        }
                        break;
                    default:
                        break;
                }
            }
        } catch (@NonNull XmlPullParserException | IOException e) {
            Log.e(TAG, "The stream cannot be parsed! Is it really well-formed? " + e.getMessage());
        }
        return items;
    }
}
