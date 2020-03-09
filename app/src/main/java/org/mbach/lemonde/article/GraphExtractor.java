package org.mbach.lemonde.article;

import android.content.Context;
import android.graphics.Color;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.Chart;
import com.github.mikephil.charting.charts.HorizontalBarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
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
import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;

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

    private JSONObject json;

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
                //Log.d(TAG, rawChart);
                json = new JSONObject(rawChart);
            } catch (JSONException e) {
                Log.e(TAG, e.getMessage());
            }
        }
    }

    static int getModelType(@Nullable Chart chart) {
        if (chart == null) {
            return Model.UNKNOWN_TYPE;
        } else {
            String type = chart.getTag().toString();
            if (HorizontalBarChart.class.getSimpleName().equals(type)) {
                return GraphModel.GRAPH_TYPE_BARS;
            } else if (BarChart.class.getSimpleName().equals(type)) {
                return GraphModel.GRAPH_TYPE_COLUMNS;
            } else if (LineChart.class.getSimpleName().equals(type)) {
                return GraphModel.GRAPH_TYPE_LINE;
            } else {
                return Model.UNKNOWN_TYPE;
            }
        }
    }

    /**
     * @return the chart
     */
    @Nullable
    Chart generateChart() {
        if (json == null) {
            Log.e(TAG, "nothing to generate");
            return null;
        }
        try {
            String type = json.getJSONObject("chart").getString("type");
            Log.d(TAG, "chart = " + json.getJSONObject("chart"));
            Log.d(TAG, "type = " + type);
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
            //Log.e(TAG, e.getMessage());
            return null;
        }
    }


    /**
     * @return the chart
     */
    @NonNull
    private BarChart generateBarChart() throws JSONException {
        List<IBarDataSet> dataSets = new ArrayList<>();
        List<BarEntry> values = new ArrayList<>();
        BarChart barChart = new BarChart(context);
        JSONArray series = json.getJSONArray("series");
        JSONArray categories = json.getJSONObject("xAxis").getJSONArray("categories");
        String[] labels = new String[categories.length()];
        for (int i = 0; i < categories.length(); i++) {
            Log.d(TAG, "labels = " + categories.getString(i));
            labels[i] = categories.getString(i);
        }
        XAxis x = barChart.getXAxis();
        x.setLabelCount(labels.length);
        x.setValueFormatter(new AxisValueFormatter(labels));

        for (int s = 0; s < series.length(); s++) {
            JSONObject set = series.getJSONObject(s);
            JSONArray data = set.getJSONArray("data");
            String name = set.getString("name");
            for (int i = 0; i < data.length(); i++) {
                Object objectData = data.get(i);
                if (objectData instanceof JSONArray) {
                    JSONArray array = (JSONArray) objectData;
                    int length = array.length();
                    if (length > 1) {
                        String value = array.getString(1);
                        if (value == null || value.equals("null")) {
                            values.add(new BarEntry(i, 0));
                        } else {
                            values.add(new BarEntry(i, Float.valueOf(value)));
                        }
                    }
                } else if (objectData instanceof JSONObject) {
                    Log.d(TAG, "received data is malformed");
                    JSONObject object = (JSONObject) objectData;
                    values.add(new BarEntry(i, Float.valueOf(object.getString("y"))));
                } else {
                    throw new JSONException("Value " + objectData + " at " + i + " of type " + objectData.getClass().getName() + " cannot be converted to JSONArray");
                }
            }

            BarDataSet dataSet = new BarDataSet(values, name);
            dataSet.setColor(Color.parseColor(set.getString("color")));
            dataSet.setValueTextColor(ThemeUtils.getStyleableColor(context, R.styleable.CustomTheme_defaultText));
            dataSet.setDrawValues(set.getJSONObject("dataLabels").getInt("enabled") == 1);
            dataSets.add(dataSet);
        }

        BarData barData = new BarData(dataSets);
        barChart.setData(barData);
        barChart.setTag(BarChart.class.getSimpleName());
        return barChart;
    }

    /**
     * @return the chart
     */
    @NonNull
    private BarChart generateHorizontalBarChart() throws JSONException {
        List<IBarDataSet> dataSets = new ArrayList<>();
        HorizontalBarChart horizontalBarChart = new HorizontalBarChart(context);
        List<BarEntry> values = new ArrayList<>();
        JSONArray series = json.getJSONArray("series");
        JSONArray categories = json.getJSONObject("xAxis").getJSONArray("categories");
        String[] labels = new String[categories.length()];
        for (int i = 0; i < categories.length(); i++) {
            Log.d(TAG, "labels = " + categories.getString(i));
            labels[i] = categories.getString(i);
        }
        XAxis x = horizontalBarChart.getXAxis();
        x.setLabelCount(labels.length);
        x.setValueFormatter(new AxisValueFormatter(labels));

        for (int s = 0; s < series.length(); s++) {
            JSONObject set = series.getJSONObject(s);
            JSONArray data = set.getJSONArray("data");
            for (int i = 0; i < data.length(); i++) {
                Object objectData = data.get(i);
                if (objectData instanceof JSONArray) {
                    JSONArray array = (JSONArray) objectData;
                    int length = array.length();
                    if (length > 1) {
                        String value = array.getString(1);
                        if (value == null) {
                            values.add(new BarEntry(i, 0));
                        } else {
                            values.add(new BarEntry(i, Float.valueOf(value)));
                        }
                    }
                } else if (objectData instanceof JSONObject) {
                    Log.d(TAG, "received data is malformed");
                    JSONObject object = (JSONObject) objectData;
                    values.add(new BarEntry(i, Float.valueOf(object.getString("y"))));
                } else {
                    throw new JSONException("Value " + objectData + " at " + i + " of type " + objectData.getClass().getName() + " cannot be converted to JSONArray");
                }
            }
            BarDataSet dataSet = new BarDataSet(values, set.getString("name"));
            dataSet.setColor(Color.parseColor(set.getString("color")));
            dataSet.setValueTextColor(ThemeUtils.getStyleableColor(context, R.styleable.CustomTheme_defaultText));
            dataSet.setDrawValues(set.getJSONObject("dataLabels").getInt("enabled") == 1);
            dataSets.add(dataSet);
        }
        BarData barData = new BarData(dataSets);
        horizontalBarChart.setData(barData);
        horizontalBarChart.setTag(HorizontalBarChart.class.getSimpleName());
        return horizontalBarChart;
    }

    /**
     * @return the chart
     */
    @NonNull
    private Chart generateLineChart() throws JSONException {
        List<ILineDataSet> dataSets = new ArrayList<>();
        LineChart lineChart = new LineChart(context);
        JSONArray series = json.getJSONArray("series");
        JSONArray categories = json.getJSONObject("xAxis").getJSONArray("categories");
        String[] labels = new String[categories.length()];
        for (int i = 0; i < categories.length(); i++) {
            Log.d(TAG, "labels = " + categories.getString(i));
            labels[i] = categories.getString(i);
        }
        XAxis x = lineChart.getXAxis();
        x.setLabelCount(labels.length);
        x.setValueFormatter(new AxisValueFormatter(labels));

        for (int s = 0; s < series.length(); s++) {
            JSONObject set = series.getJSONObject(s);
            JSONArray data = set.getJSONArray("data");

            List<Entry> values = new ArrayList<>();
            for (int i = 0; i < data.length(); i++) {
                JSONArray array = data.getJSONArray(i);
                int length = array.length();
                if (length > 1) {
                    String value = array.getString(1);
                    if (value == null) {
                        values.add(new Entry(i, 0));
                    } else {
                        values.add(new Entry(i, Float.valueOf(value)));
                    }
                }
            }
            LineDataSet dataSet = new LineDataSet(values, set.getString("name"));
            int color = Color.parseColor(set.getString("color"));
            dataSet.setColor(color);
            dataSet.setCircleColor(color);
            dataSet.setDrawCircleHole(false);
            dataSet.setDrawValues(set.getJSONObject("dataLabels").getInt("enabled") == 1);
            dataSets.add(dataSet);
        }

        LineData lineData = new LineData(dataSets);
        lineChart.setData(lineData);
        lineChart.setTag(LineChart.class.getSimpleName());
        return lineChart;
    }
}
