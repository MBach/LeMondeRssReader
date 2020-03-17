package org.mbach.lemonde.article;

import android.os.Parcel;
import android.os.Parcelable;
import android.util.Log;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Model class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class Model implements Parcelable {

    private static final String TAG = "Model";

    public static final Parcelable.Creator<Model> CREATOR = new Parcelable.Creator<Model>() {
        public Model createFromParcel(@NonNull Parcel in) {
            return new Model(in);
        }

        public Model[] newArray(int size) {
            return new Model[size];
        }
    };
    static final int UNKNOWN_TYPE = -1;
    static final int TEXT_TYPE = 0;
    static final int IMAGE_TYPE = 1;
    static final int TWEET_TYPE = 2;
    static final int FACTS_TYPE = 3;
    static final int COMMENT_TYPE = 4;
    static final int BUTTON_TYPE = 5;
    static final int VIDEO_TYPE = 6;
    static final int LIVE_TYPE = 7;
    static final int TEXT_AND_ICON_TYPE = 8;

    private final int id;
    private final int type;
    @NonNull
    private final Object theContent;

    private Model(Parcel in) {
        this.id = in.readInt();
        this.type = in.readInt();
        this.theContent = in.readValue(TextView.class.getClassLoader());
    }

    Model(int type, @NonNull Object view, int id) {
        this.type = type;
        this.theContent = view;
        this.id = id;
    }

    /*
    Model(int type) {
        this.id = 0;
        this.type = type;
        this.theContent = null; /// FIXME
    }
    */

    int getType() {
        return type;
    }

    int getId() {
        return id;
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
