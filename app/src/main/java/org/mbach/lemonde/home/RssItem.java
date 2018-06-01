package org.mbach.lemonde.home;

import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

/**
 * RssItem class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class RssItem implements Parcelable {

    private String link = null;
    private String title = null;
    private Integer articleId = null;
    private String enclosure = null;

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
    }

    RssItem() {

    }

    @Nullable
    String getLink() {
        return link;
    }

    void setLink(String link) {
        this.link = link;
    }

    @Nullable
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @Nullable
    String getEnclosure() {
        return enclosure;
    }

    void setEnclosure(String enclosure) {
        this.enclosure = enclosure;
    }

    void setArticleId(int articleId) {
        this.articleId = articleId;
    }

    int getArticleId() {
        return this.articleId;
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
    }
}