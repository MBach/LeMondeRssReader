package org.mbach.lemonde.article;

import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.widget.TextView;

/**
 * Model class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class Model implements Parcelable {

    static final int UNKNOWN_TYPE = -1;
    static final int TEXT_TYPE = 0;
    static final int IMAGE_TYPE = 1;
    static final int TWEET_TYPE = 2;
    static final int FACTS_TYPE = 3;
    static final int COMMENT_TYPE = 4;
    static final int GRAPH_TYPE_BARS = 5;
    static final int GRAPH_TYPE_COLUMNS = 6;
    static final int GRAPH_TYPE_LINE = 7;
    static final int BUTTON_TYPE = 8;
    static final int VIDEO_TYPE = 9;

    private final int id;
    private final int type;
    @NonNull
    private final Object theContent;

    public static final Parcelable.Creator<Model> CREATOR = new Parcelable.Creator<Model>() {
        public Model createFromParcel(@NonNull Parcel in) {
            return new Model(in);
        }

        public Model[] newArray(int size) {
            return new Model[size];
        }
    };

    private Model(Parcel in) {
        id = in.readInt();
        type = in.readInt();
        theContent = in.readValue(TextView.class.getClassLoader());
    }

    Model(@NonNull TextView textView) {
        this.type = TEXT_TYPE;
        this.id = 0;
        theContent = textView;
    }

    Model(int type, @NonNull Object view) {
        this.type = type;
        this.id = 0;
        theContent = view;
    }

    Model(@NonNull TextView textView, int id) {
        this.type = COMMENT_TYPE;
        this.id = id;
        theContent = textView;
    }

    int getType() {
        return type;
    }

    @NonNull
    Object getTheContent() {
        return theContent;
    }

    @Override
    public boolean equals(@Nullable Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Model model = (Model) o;

        return id == model.id && type == model.type;
    }

    @Override
    public int hashCode() {
        int result = id;
        result = 31 * result + type;
        return result;
    }

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {

    }
}
