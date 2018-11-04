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

    @Nullable
    private String link = null;
    @Nullable
    private String title = null;
    @Nullable
    private Integer articleId = null;
    @Nullable
    private String enclosure = null;
    @Nullable
    private String category = null;
    private long pubDate;
    private final int type;

    public static final Parcelable.Creator<RssItem> CREATOR = new Parcelable.Creator<RssItem>() {
        public RssItem createFromParcel(@NonNull Parcel in) {
            return new RssItem(in);
        }

        public RssItem[] newArray(int size) {
            return new RssItem[size];
        }
    };

    private RssItem(Parcel in) {
        link = in.readString();
        title = in.readString();
        articleId = in.readInt();
        enclosure = in.readString();
        pubDate = in.readLong();
        type = ARTICLE_TYPE;
    }

    public RssItem(int type) {
        this.type = type;
    }

    @Nullable
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
    public String getEnclosure() {
        return enclosure;
    }

    public void setEnclosure(@Nullable String enclosure) {
        this.enclosure = enclosure;
    }

    public int getArticleId() {
        return articleId;
    }

    public void setArticleId(int articleId) {
        this.articleId = articleId;
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
        dest.writeInt(articleId);
        dest.writeString(enclosure);
        dest.writeLong(pubDate);
    }
}