package org.mbach.lemonde.home;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;
import android.util.Xml;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.util.ArrayList;

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

    @NonNull
    ArrayList<RssItem> parse(String stream) {
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
        /// TODO: store cache calls maybe here!
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
                        if (tagName.equalsIgnoreCase("item")) {
                            items.add(item);
                        } else if (tagName.equalsIgnoreCase(TAG_LINK)) {
                            item.setLink(text);
                        } else if (tagName.equalsIgnoreCase(TAG_TITLE)) {
                            item.setTitle(text);
                        } else if (tagName.equalsIgnoreCase(TAG_ENCLOSURE)) {
                            text = parser.getAttributeValue(null, "url");
                            item.setEnclosure(text);
                        }
                        break;
                    default:
                        break;
                }
            }
        } catch (XmlPullParserException | IOException e ) {
            Log.e(TAG, "The stream cannot be parsed! Is it really well-formed? " + e.getMessage());
        }
        return items;
    }
}
