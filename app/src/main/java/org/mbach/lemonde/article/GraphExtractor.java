package org.mbach.lemonde.article;

import android.content.Context;
import android.util.Log;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.jsoup.nodes.Element;

import java.util.ArrayList;
import java.util.List;

/**
 * GraphExtractor class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class GraphExtractor {
    public static final String TAG = "GraphExtractor";

    private final Context context;

    public GraphExtractor(Context context, Element graph) {
        this.context = context;
        Log.d(TAG, "todo graph");

        String script = graph.html();
        String beginExpr = "new Highcharts.Chart({";
        int beginIndex = script.indexOf(beginExpr) + beginExpr.length() - 1;
        if (beginIndex != -1) {
            int endIndex = script.indexOf("});", beginIndex);
            if (endIndex != -1) {
                String rawChart = script.substring(beginIndex, endIndex);
                try {
                    JSONObject jsonObject = new JSONObject(rawChart);
                    JSONArray yAxis = jsonObject.getJSONArray("yAxis");
                    JSONObject xAxis = jsonObject.getJSONObject("xAxis");
                    JSONArray categories = xAxis.getJSONArray("categories");
                    Log.d(TAG, "categories: " + categories.length());

                    for (int i = 0; i < categories.length(); i++) {
                        Log.d(TAG, categories.get(i).toString());
                    }
                } catch (JSONException e) {
                    Log.e(TAG, e.getMessage());
                }
                Log.d(TAG, "size: " + rawChart.length());
            }
        }
    }

    public Object generate() {
        BarChart barChart = new BarChart(context);

        List<BarEntry> yVals1 = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            float mult = 5;
            float val = (float) (Math.random() * mult);
            yVals1.add(new BarEntry(i, val));
        }

        BarDataSet set1 = new BarDataSet(yVals1, "The year 2017");
        List<IBarDataSet> dataSets = new ArrayList<>();
        dataSets.add(set1);
        BarData barData = new BarData(dataSets);
        barChart.setData(barData);
        return barChart;
    }
}
