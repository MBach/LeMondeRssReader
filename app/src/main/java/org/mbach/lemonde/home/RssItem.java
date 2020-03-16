package org.mbach.lemonde.home;

import android.os.Parcel;
import android.os.Parcelable;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * RssItem class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class RssItem implements Parcelable {

    public static final int ARTICLE_TYPE = 0;
    public static final int DATE_GROUP_TYPE = 1;
    public static final Parcelable.Creator<RssItem> CREATOR = new Parcelable.Creator<RssItem>() {
        public RssItem createFromParcel(@NonNull Parcel in) {
            return new RssItem(in);
        }

        public RssItem[] newArray(int size) {
            return new RssItem[size];
        }
    };
    private final int type;

    private String link = null;

    @Nullable
    private String title = null;

    @Nullable
    private String mediaContent = null;

    @Nullable
    private String category = null;

    @Nullable
    private String subtype = null;

    private long pubDate;

    private RssItem(Parcel in) {
        link = in.readString();
        title = in.readString();
        pubDate = in.readLong();
        mediaContent = in.readString();
        type = ARTICLE_TYPE;
        subtype = in.readString();
    }

    public RssItem(int type) {
        this.type = type;
    }

    public String getLink() {
        return link;
    }

    public void setLink(@Nullable String link) {
        this.link = link;
    }

    @Nullable
    public String getTitle() {
        return title;
    }

    public void setTitle(@Nullable String title) {
        this.title = title;
    }

    @Nullable
    public String getMediaContent() {
        return mediaContent;
    }

    public void setMediaContent(@Nullable String mediaContent) {
        this.mediaContent = mediaContent;
    }

    public long getPubDate() {
        return pubDate;
    }

    public void setPubDate(long pubDate) {
        this.pubDate = pubDate;
    }

    @Nullable
    public String getCategory() {
        return category;
    }

    public void setCategory(@Nullable String category) {
        this.category = category;
    }

    @Nullable
    public String getSubtype() {
        return subtype;
    }

    public void setSubtype(@Nullable String subtype) {
        this.subtype = subtype;
    }

    public int getType() {
        return type;
    }

    @Override
    public int describeContents() {
        return this.hashCode();
    }

    @Override
    public void writeToParcel(@NonNull Parcel dest, int flags) {
        dest.writeString(link);
        dest.writeString(title);
        dest.writeLong(pubDate);
        dest.writeString(mediaContent);
        dest.writeString(subtype);
    }
}