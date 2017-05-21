package org.mbach.lemonde.article;

import android.widget.TextView;

/**
 * Model class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class Model {

    public static final int TEXT_TYPE = 0;
    public static final int IMAGE_TYPE = 1;
    public static final int BLANK_TYPE = 2;

    private final int type;
    private final Object theContent;

    public Model(TextView textView) {
        this.type = TEXT_TYPE;
        theContent = textView;
    }

    public Model(int type, Object view) {
        this.type = type;
        theContent = view;
    }

    public int getType() {
        return type;
    }

    public Object getTheContent() {
        return theContent;
    }
}
