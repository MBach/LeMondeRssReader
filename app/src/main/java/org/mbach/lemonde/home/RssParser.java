package org.mbach.lemonde.home;

import android.support.annotation.NonNull;
import android.util.Log;
import android.util.Xml;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Locale;
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
    private static final String TAG_PUBDATE = "pubDate";
    private static final Pattern ARTICLE_ID_PATTERN = Pattern.compile("/(\\d{6,10})/");
    private static final SimpleDateFormat SDF = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss Z", Locale.UK);

    @NonNull
    ArrayList<RssItem> parse(@NonNull String stream) {
        ArrayList<RssItem> items = null;
        try {
            XmlPullParser parser = Xml.newPullParser();
            parser.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false);
            InputStream s = new ByteArrayInputStream(stream.getBytes( "ISO-8859-1"));
            parser.setInput(s, "UTF-8");
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
        RssItem item = new RssItem(RssItem.ARTICLE_TYPE);
        String text = null;
        try {
            while (parser.next() != XmlPullParser.END_DOCUMENT) {

                String tagName = parser.getName();
                switch (parser.getEventType()) {
                    case XmlPullParser.START_TAG:
                        if (tagName.equalsIgnoreCase(TAG_ITEM)) {
                            item = new RssItem(RssItem.ARTICLE_TYPE);
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
                        } else if (tagName.equalsIgnoreCase(TAG_PUBDATE)) {
                            try {
                                // Cut-off time info (used for grouping favorites)
                                Calendar cal = Calendar.getInstance();
                                cal.setTime(SDF.parse(text));
                                cal.set(Calendar.HOUR_OF_DAY, 0);
                                cal.set(Calendar.MINUTE, 0);
                                cal.set(Calendar.SECOND, 0);
                                cal.set(Calendar.MILLISECOND, 0);
                                item.setPubDate(cal.getTimeInMillis());
                            } catch (ParseException e) {
                                Log.d(TAG, "cannot parse date: " + text);
                            }
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
