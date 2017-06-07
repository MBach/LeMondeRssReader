package org.mbach.lemonde.home;

import android.os.Parcel;
import android.os.Parcelable;

/**
 * RssItem class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class RssItem implements Parcelable {

    private String link = null;
    private String title = null;
    private String description = null;
    private String enclosure = null;

    public static final Parcelable.Creator<RssItem> CREATOR = new Parcelable.Creator<RssItem>() {
        public RssItem createFromParcel(Parcel in) {
            return new RssItem(in);
        }

        public RssItem[] newArray(int size) {
            return new RssItem[size];
        }
    };

    private RssItem(Parcel in) {
        link = in.readString();
        title = in.readString();
        description = in.readString();
        enclosure = in.readString();
    }

    RssItem() {

    }

    String getLink() {
        return link;
    }

    void setLink(String link) {
        this.link = link;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    String getDescription() {
        return description;
    }

    void setDescription(String description) {
        this.description = description;
    }

    /*public String getPubDate() {
        return pubDate;
    }*/

    /*public void setPubDate(String pubDate) {
        this.pubDate = pubDate;
    }*/

    /*public String getGuid() {
        return guid;
    }*/

    /*public void setGuid(String guid) {
        this.guid = guid;
    }*/

    String getEnclosure() {
        return enclosure;
    }

    void setEnclosure(String enclosure) {
        this.enclosure = enclosure;
    }

    @Override
    public int describeContents() {
        return this.hashCode();
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(link);
        dest.writeString(title);
        dest.writeString(description);
        dest.writeString(enclosure);
    }
}