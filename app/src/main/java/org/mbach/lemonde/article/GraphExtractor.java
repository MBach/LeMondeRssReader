package org.mbach.lemonde.article;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.Chart;
import com.github.mikephil.charting.charts.HorizontalBarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;
import com.github.mikephil.charting.interfaces.datasets.ILineDataSet;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * GraphExtractor class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class GraphExtractor {
    private static final String TAG = "GraphExtractor";

    @NonNull
    private final Context context;

    private JSONObject data;

    @NonNull
    private String legend = "";

    static int getModelType(@Nullable Chart chart) {
        if (chart == null) {
            return Model.UNKNOWN_TYPE;
        } else {
            String type = chart.getTag().toString();
            if (HorizontalBarChart.class.getSimpleName().equals(type)) {
                return Model.GRAPH_TYPE_BARS;
            } else if (BarChart.class.getSimpleName().equals(type)) {
                return Model.GRAPH_TYPE_COLUMNS;
            } else if (LineChart.class.getSimpleName().equals(type)) {
                return Model.GRAPH_TYPE_LINE;
            } else {
                return Model.UNKNOWN_TYPE;
            }
        }
    }

    /**
     * @param context the context from the Activity
     * @param script  raw data extracted with JSoup from a script tag in the HTML page
     */
    GraphExtractor(@NonNull Context context, String script) {
        this.context = context;

        // Remove formatter
        script = script.replaceAll("formatter:([^`])*\\}", "}");

        // Remove extra comma
        script = script.replaceAll(",([^a-z])*\\}", "}");

        // Remove values between simple quotes (like '<style>some code with "</style>')
        script = script.replaceAll("'.*'", "\"\"");

        // Fix missing double quotes
        script = script.replaceAll("(['\"])?([a-zA-Z0-9_-]+)(['\"])?( )?:", "\"$2\":");

        String beginExpr = "new Highcharts.Chart({";
        int beginIndex = script.indexOf(beginExpr) + beginExpr.length() - 1;
        int endIndex = script.indexOf("});", beginIndex);
        if (endIndex != -1) {
            try {
                String rawChart = script.substring(beginIndex, endIndex + 1) + "}";
                Log.d(TAG, rawChart);
                data = new JSONObject(rawChart);
            } catch (JSONException e) {
                //Log.e(TAG, e.getMessage());
            }
        }
    }

    void setLegend(@NonNull String legend) {
        this.legend = legend;
    }

    /**
     * @return the chart
     */
    @Nullable
    Chart generate() {
        if (data == null) {
            return null;
        }
        try {
            String type = data.getJSONObject("chart").getString("type");
            Chart chart = null;
            switch (type) {
                case "column":
                    chart = generateBarChart();
                    break;
                case "bar":
                    chart = generateHorizontalBarChart();
                    break;
                case "line":
                    chart = generateLineChart();
                    break;
                default:
                    break;
            }
            return chart;
        } catch (JSONException e) {
            Log.d(TAG, e.getMessage());
            return null;
        }
    }


    /**
     * @return the chart
     */
    @NonNull
    private BarChart generateBarChart() throws JSONException {
        List<BarEntry> values = new ArrayList<>();
        BarChart barChart = new BarChart(context);
        JSONArray series = data.getJSONArray("series");
        JSONObject first = series.getJSONObject(0);
        JSONArray dataSeries = first.getJSONArray("data");
        for (int i = 0; i < dataSeries.length(); i++) {
            Object data = dataSeries.get(i);
            if (data instanceof JSONArray) {
                JSONArray array = (JSONArray) data;
                int length = array.length();
                if (length > 1) {
                    String value = array.getString(1);
                    values.add(new BarEntry(i, Float.valueOf(value)));
                }
            } else if (data instanceof JSONObject) {
                Log.d(TAG, "received data is malformed");
                JSONObject object = (JSONObject) data;
                values.add(new BarEntry(i, Float.valueOf(object.getString("y"))));
            } else {
                throw new JSONException("Value " + data + " at " + i + " of type " + data.getClass().getName() + " cannot be converted to JSONArray");
            }
        }

        List<IBarDataSet> dataSets = new ArrayList<>();
        BarDataSet dataSet = new BarDataSet(values, this.legend);
        dataSets.add(dataSet);
        BarData barData = new BarData(dataSets);
        barChart.setData(barData);
        barChart.setTag(BarChart.class.getSimpleName());

        XAxis xAxis = barChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setGranularity(1f);
        xAxis.setLabelCount(values.size());
        JSONArray categories = data.getJSONObject("xAxis").getJSONArray("categories");
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < categories.length(); i++) {
            labels.add(categories.getString(i));
        }
        xAxis.setValueFormatter(new XAxisValueFormatter(labels));
        return barChart;
    }

    /**
     * @return the chart
     */
    @NonNull
    private BarChart generateHorizontalBarChart() throws JSONException {
        HorizontalBarChart barChart = new HorizontalBarChart(context);
        barChart.getXAxis().setDrawAxisLine(false);
        List<BarEntry> values = new ArrayList<>();
        JSONArray series = data.getJSONArray("series");
        JSONObject first = series.getJSONObject(0);
        JSONArray dataSeries = first.getJSONArray("data");
        for (int i = 0; i < dataSeries.length(); i++) {
            Object data = dataSeries.get(i);
            if (data instanceof JSONArray) {
                JSONArray array = (JSONArray) data;
                int length = array.length();
                if (length > 1) {
                    String value = array.getString(1);
                    values.add(new BarEntry(i, Float.valueOf(value)));
                }
            } else if (data instanceof JSONObject) {
                Log.d(TAG, "received data is malformed");
                JSONObject object = (JSONObject) data;
                values.add(new BarEntry(i, Float.valueOf(object.getString("y"))));
            } else {
                throw new JSONException("Value " + data + " at " + i + " of type " + data.getClass().getName() + " cannot be converted to JSONArray");
            }
        }

        List<IBarDataSet> dataSets = new ArrayList<>();
        BarDataSet dataSet = new BarDataSet(values, this.legend);
        dataSets.add(dataSet);
        BarData barData = new BarData(dataSets);
        barChart.setData(barData);
        barChart.setTag(HorizontalBarChart.class.getSimpleName());

        YAxis yAxis = barChart.getAxisLeft();
        yAxis.setDrawGridLines(false);
        yAxis.setGranularity(1f);
        yAxis.setLabelCount(values.size());
        JSONArray categories = data.getJSONObject("xAxis").getJSONArray("categories");
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < categories.length(); i++) {
            labels.add(categories.getString(i));
        }
        yAxis.setDrawLabels(true);
        yAxis.setValueFormatter(new XAxisValueFormatter(labels));
        return barChart;
    }

    /**
     * @return the chart
     */
    @NonNull
    private Chart generateLineChart() throws JSONException {
        Log.d(TAG, "generateLineChart");
        LineChart lineChart = new LineChart(context);
        JSONArray series = data.getJSONArray("series");
        JSONObject first = series.getJSONObject(0);
        JSONArray dataSeries = first.getJSONArray("data");

        List<Entry> values = new ArrayList<>();

        for (int i = 0; i < dataSeries.length(); i++) {
            JSONArray array = dataSeries.getJSONArray(i);
            int length = array.length();
            if (length > 1) {
                String value = array.getString(1);
                values.add(new Entry(i, Float.valueOf(value)));
            }
        }

        ILineDataSet dataSet = new LineDataSet(values, this.legend);
        List<ILineDataSet> dataSets = new ArrayList<>();
        dataSets.add(dataSet);
        LineData lineData = new LineData(dataSets);
        lineChart.setData(lineData);
        lineChart.setTag(LineChart.class.getSimpleName());

        YAxis yAxis = lineChart.getAxisLeft();
        yAxis.setDrawGridLines(false);
        yAxis.setGranularity(1f);
        yAxis.setLabelCount(values.size());
        JSONArray categories = data.getJSONObject("xAxis").getJSONArray("categories");
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < categories.length(); i++) {
            labels.add(categories.getString(i));
        }
        yAxis.setDrawLabels(true);
        yAxis.setValueFormatter(new XAxisValueFormatter(labels));
        return lineChart;
    }
}
