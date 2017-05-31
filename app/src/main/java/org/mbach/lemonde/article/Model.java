package org.mbach.lemonde.article;

import android.widget.TextView;

/**
 * Model class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class Model {

    static final int TEXT_TYPE = 0;
    static final int IMAGE_TYPE = 1;
    static final int TWEET_TYPE = 2;
    static final int GRAPH_TYPE = 3;

    private final int type;
    private final Object theContent;

    Model(TextView textView) {
        this.type = TEXT_TYPE;
        theContent = textView;
    }

    Model(int type, Object view) {
        this.type = type;
        theContent = view;
    }

    int getType() {
        return type;
    }

    Object getTheContent() {
        return theContent;
    }
}
