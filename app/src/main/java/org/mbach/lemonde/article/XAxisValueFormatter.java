package org.mbach.lemonde.article;

import android.util.Log;

import com.github.mikephil.charting.components.AxisBase;
import com.github.mikephil.charting.formatter.IAxisValueFormatter;

import java.util.List;

/**
 * Model class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-06
 */
class XAxisValueFormatter implements IAxisValueFormatter {

    private static final String TAG = "XAxisVF";

    private List<String> labels;

    XAxisValueFormatter(List<String> labels) {
        this.labels = labels;
    }

    @Override
    public String getFormattedValue(float value, AxisBase axis) {
        Log.d(TAG, "value: " + value);
        return String.valueOf(value);
    }
}
