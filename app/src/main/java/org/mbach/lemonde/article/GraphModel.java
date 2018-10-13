package org.mbach.lemonde.article;

import com.github.mikephil.charting.charts.Chart;

/**
 * GraphModel class.
 *
 * @author Matthieu BACHELIER
 * @since 2018-10
 */
class GraphModel extends Model {

    static final int GRAPH_TYPE_BARS = 1005;
    static final int GRAPH_TYPE_COLUMNS = 1006;
    static final int GRAPH_TYPE_LINE = 1007;

    private final Chart chart;
    private String title;
    private String subtitle;
    private String source;

    GraphModel(int type, Chart chart) {
        super(type, chart);
        this.chart = chart;
    }

    Chart getChart() {
        return this.chart;
    }

    String getTitle() {
        return this.title;
    }

    String getSubtitle() {
        return this.subtitle;
    }

    String getSource() {
        return this.source;
    }

    void setTitle(String title) {
        this.title = title;
    }

    void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    void setSource(String source) {
        this.source = source;
    }
}
