package org.mbach.lemonde.article;

import com.github.mikephil.charting.components.AxisBase;
import com.github.mikephil.charting.formatter.IAxisValueFormatter;

/**
 * Model class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-06
 */
class AxisValueFormatter implements IAxisValueFormatter {

    private final String[] labels;

    AxisValueFormatter(final String[] values) {
        this.labels = values;
    }

    @Override
    public String getFormattedValue(float value, AxisBase axis) {
        return labels[(int) value];
    }
}
