package org.mbach.lemonde.home;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Xml;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserException;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 *
 */
public class LeMondeRssParser {
    private static final String TAG_TITLE = "title";
    private static final String TAG_LINK = "link";
    private static final String TAG_DESCRIPTION = "description";
    private static final String TAG_GUID = "guid";
    private static final String TAG_ENCLOSURE = "enclosure";
    private static final String TAG_PUBDATE = "pubDate";
    private static final String TAG_RSS = "rss";
    private static final String TAG_ITEM = "item";

    @NonNull
    public List<RssItem> parse(@Nullable InputStream inputStream) throws XmlPullParserException, IOException {
        try {
            XmlPullParser parser = Xml.newPullParser();
            parser.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false);
            parser.setInput(inputStream, "utf-8");
            parser.nextTag();
            parser.require(XmlPullParser.START_TAG, null, TAG_RSS);
            return readFeed(parser);
        } finally {
            if (inputStream != null) {
                inputStream.close();
            }
        }
    }

    /**
     *
     * @param parser
     * @return
     * @throws XmlPullParserException
     * @throws IOException
     */
    @NonNull
    private List<RssItem> readFeed(@NonNull XmlPullParser parser) throws XmlPullParserException, IOException {
        List<RssItem> items = new ArrayList<>();
        RssItem item = new RssItem();
        String text = null;
        /// TODO: store cache calls maybe here!
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
                    } else if (tagName.equalsIgnoreCase(TAG_DESCRIPTION)) {
                        item.setDescription(text);
                    } else if (tagName.equalsIgnoreCase(TAG_PUBDATE)) {
                        item.setPubDate(text);
                    } else if (tagName.equalsIgnoreCase(TAG_GUID)) {
                        item.setGuid(text);
                    } else if (tagName.equalsIgnoreCase(TAG_ENCLOSURE)) {
                        text = parser.getAttributeValue(null, "url");
                        item.setEnclosure(text);
                    }
                    break;
                default:
                    break;
            }
        }
        return items;
    }
}
