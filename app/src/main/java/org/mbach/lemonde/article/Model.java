package org.mbach.lemonde.article;

import android.widget.TextView;

/**
 * Model class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class Model {

    static final int UNKNOWN_TYPE = -1;
    static final int TEXT_TYPE = 0;
    static final int IMAGE_TYPE = 1;
    static final int TWEET_TYPE = 2;
    static final int COMMENT_TYPE = 3;
    static final int GRAPH_TYPE_BARS = 4;
    static final int GRAPH_TYPE_COLUMNS = 5;
    static final int GRAPH_TYPE_LINE = 6;

    private final int id;
    private final int type;
    private final Object theContent;

    Model(TextView textView) {
        this.type = TEXT_TYPE;
        this.id = 0;
        theContent = textView;
    }

    Model(int type, Object view) {
        this.type = type;
        this.id = 0;
        theContent = view;
    }

    Model(TextView textView, int id) {
        this.type = COMMENT_TYPE;
        this.id = id;
        theContent = textView;
    }

    int getType() {
        return type;
    }

    Object getTheContent() {
        return theContent;
    }

    @Override
    public boolean equals(Object o) {
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
}
