package org.mbach.lemonde.article;

import android.net.Uri;
import android.os.Build;
import android.support.annotation.NonNull;
import android.support.v7.widget.CardView;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.MediaController;
import android.widget.TextView;
import android.widget.VideoView;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.HorizontalBarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.LineData;
import com.squareup.picasso.Picasso;

import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * ArticleAdapter class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class ArticleAdapter extends RecyclerView.Adapter {

    private static final String TAG = "ArticleAdapter";

    private List<Model> items;

    /**
     * Add items to render.
     *
     * @param items list of items (incl. comments) to display
     */
    void addItems(List<Model> items) {
        if (this.items == null) {
            this.items = items;
        } else {
            List<Model> previousComments = new ArrayList<>();
            for (Model model : this.items) {
                if (model.getType() == Model.COMMENT_TYPE) {
                    previousComments.add(model);
                }
            }

            List<Model> next = new ArrayList<>(items);
            if (!previousComments.isEmpty()) {
                next.removeAll(previousComments);
            }
            this.items.addAll(next);
        }
        notifyDataSetChanged();
    }

    /**
     * Add a single item to render.
     *
     * @param item item to add
     */
    void addItem(Model item) {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        this.items.add(item);
        notifyDataSetChanged();
    }

    @Override
    public int getItemCount() {
        return items == null ? 0 : items.size();
    }

    @Override
    public int getItemViewType(int position) {
        return items == null ? -1 : items.get(position).getType();
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        switch (viewType) {
            default:
            case Model.TEXT_TYPE:
            case Model.COMMENT_TYPE:
                return new ViewHolderText(new TextView(parent.getContext()));
            case Model.IMAGE_TYPE:
                return new ViewHolderImage(new ImageView(parent.getContext()));
            case Model.TWEET_TYPE:
                return new ViewHolderTweet(LayoutInflater.from(parent.getContext()).inflate(R.layout.tweet_card, parent, false));
            case Model.FACTS_TYPE:
                return new ViewHolderFact(LayoutInflater.from(parent.getContext()).inflate(R.layout.fact_card, parent, false));
            case Model.GRAPH_TYPE_BARS:
                return new ViewHolderHorizontalBarChart(new HorizontalBarChart(parent.getContext()));
            case Model.GRAPH_TYPE_COLUMNS:
                return new ViewHolderBarChart(new BarChart(parent.getContext()));
            case Model.GRAPH_TYPE_LINE:
                return new ViewHolderLineChart(new LineChart(parent.getContext()));
            case Model.BUTTON_TYPE:
                return new ViewHolderRestrictedContent(LayoutInflater.from(parent.getContext()).inflate(R.layout.connect_card, parent, false));
            case Model.VIDEO_TYPE:
                //return new ViewHolderVideo(new VideoView(parent.getContext()));
                return new ViewHolderVideo(LayoutInflater.from(parent.getContext()).inflate(R.layout.video_view, parent, false));
        }
    }

    @Override
    public void onBindViewHolder(@NonNull final RecyclerView.ViewHolder holder, final int position) {

        Model model = items.get(position);
        if (model == null) {
            return;
        }
        RecyclerView.LayoutParams lp = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        RecyclerView.LayoutParams lp2 = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        int defaultTextColor = ThemeUtils.getStyleableColor(holder.itemView.getContext(), R.styleable.CustomTheme_defaultText);

        switch (model.getType()) {
            case Model.TEXT_TYPE:
            case Model.COMMENT_TYPE:
                TextView textView = (TextView) model.getTheContent();
                ViewHolderText vh = (ViewHolderText) holder;
                vh.text.setText(textView.getText());
                vh.text.setTypeface(textView.getTypeface());
                vh.text.setTextColor(defaultTextColor);
                vh.text.setPadding(textView.getPaddingLeft(), textView.getPaddingTop(), textView.getPaddingRight(), textView.getPaddingBottom());
                if (android.os.Build.VERSION.SDK_INT > Build.VERSION_CODES.ICE_CREAM_SANDWICH_MR1) {
                    vh.text.setBackground(textView.getBackground());
                }
                // Tag doesn't expand horizontally to the max
                if (textView.getLayoutParams() == null) {
                    vh.text.setLayoutParams(lp);
                } else {
                    vh.text.setLayoutParams(textView.getLayoutParams());
                }
                vh.text.setTextSize(TypedValue.COMPLEX_UNIT_PX, textView.getTextSize());
                break;
            case Model.IMAGE_TYPE:
                String imageURI = (String) model.getTheContent();
                ((ViewHolderImage) holder).image.setLayoutParams(lp);
                Picasso.with(((ViewHolderImage) holder).image.getContext()).load(imageURI).into(((ViewHolderImage) holder).image);
                break;
            case Model.TWEET_TYPE:
                CardView cardView = (CardView) model.getTheContent();
                TextView tweet = (TextView) cardView.getChildAt(0);
                Button link = (Button) cardView.getChildAt(1);
                if (tweet.getText().length() == 0) {
                    View v = ((ViewHolderTweet) holder).view;
                    v.setPadding(v.getPaddingLeft(), v.getPaddingBottom(), v.getPaddingRight(), v.getPaddingBottom());
                    ((ViewHolderTweet) holder).getTweet().setVisibility(View.GONE);
                } else {
                    ((ViewHolderTweet) holder).getTweet().setText(tweet.getText());
                }
                ((ViewHolderTweet) holder).getLink().setContentDescription(link.getContentDescription());
                break;
            case Model.FACTS_TYPE:
                CardView factsView = (CardView) model.getTheContent();
                TextView fact = (TextView) factsView.getChildAt(0);
                ((ViewHolderFact) holder).getFact().setText(fact.getText());
                break;
            case Model.GRAPH_TYPE_BARS:
                HorizontalBarChart chart1 = (HorizontalBarChart) model.getTheContent();
                ViewHolderHorizontalBarChart vhhbc = (ViewHolderHorizontalBarChart) holder;
                vhhbc.chart.setData(chart1.getData());
                vhhbc.chart.setLayoutParams(lp2);
                vhhbc.chart.setDrawGridBackground(false);
                BarData data = vhhbc.chart.getData();
                data.setDrawValues(false);
                vhhbc.chart.getLegend().setTextColor(defaultTextColor);
                break;
            case Model.GRAPH_TYPE_COLUMNS:
                BarChart bc = (BarChart) model.getTheContent();
                ViewHolderBarChart vhbc = (ViewHolderBarChart) holder;
                vhbc.chart.setData(bc.getData());
                vhbc.chart.setLayoutParams(lp2);
                vhbc.chart.setDrawGridBackground(false);
                BarData data2 = vhbc.chart.getData();
                data2.setDrawValues(false);
                vhbc.chart.getLegend().setTextColor(defaultTextColor);
                break;
            case Model.GRAPH_TYPE_LINE:
                LineChart lineChart = (LineChart) model.getTheContent();
                ViewHolderLineChart vhl = (ViewHolderLineChart) holder;
                vhl.chart.setData(lineChart.getData());
                vhl.chart.setLayoutParams(lp2);
                LineData data3 = vhl.chart.getData();
                data3.setDrawValues(false);
                break;
            case Model.VIDEO_TYPE:
                Uri videoURI = (Uri) model.getTheContent();
                ViewHolderVideo viewHolderVideo = (ViewHolderVideo) holder;
                viewHolderVideo.getVideoView().setVideoURI(videoURI);
                viewHolderVideo.getVideoView().setTag(videoURI);
                viewHolderVideo.getController().show();
                viewHolderVideo.getVideoView().start();
                Log.d(TAG, "pos = " + viewHolderVideo.getVideoView().getCurrentPosition());
                break;
        }
    }

    /**
     *
     */
    static class ViewHolderText extends RecyclerView.ViewHolder {
        @NonNull
        private final TextView text;

        ViewHolderText(@NonNull View view) {
            super(view);
            this.text = (TextView) view;
        }
    }

    /**
     *
     */
    static class ViewHolderImage extends RecyclerView.ViewHolder {
        @NonNull
        private final ImageView image;

        ViewHolderImage(@NonNull View view) {
            super(view);
            this.image = (ImageView) view;
        }
    }

    /**
     *
     */
    static class ViewHolderTweet extends RecyclerView.ViewHolder {
        @NonNull
        private final View view;

        ViewHolderTweet(@NonNull View view) {
            super(view);
            this.view = view;
            this.view.setBackgroundColor(ThemeUtils.getStyleableColor(view.getContext(), R.styleable.CustomTheme_colorBackgroundDrawer));
        }

        TextView getTweet() {
            return view.findViewById(R.id.tweet_text);
        }

        Button getLink() {
            return view.findViewById(R.id.tweet_button);
        }
    }

    /**
     *
     */
    static class ViewHolderFact extends RecyclerView.ViewHolder {
        @NonNull
        private final View view;

        ViewHolderFact(@NonNull View view) {
            super(view);
            this.view = view;
            this.view.setBackgroundColor(ThemeUtils.getStyleableColor(view.getContext(), R.styleable.CustomTheme_colorBackgroundDrawer));
        }

        TextView getFact() {
            return view.findViewById(R.id.fact_text);
        }
    }

    /**
     *
     */
    static class ViewHolderBarChart extends RecyclerView.ViewHolder {

        @NonNull
        private final BarChart chart;

        ViewHolderBarChart(@NonNull BarChart chart) {
            super(chart);
            this.chart = chart;
            this.chart.setDrawGridBackground(false);
            Log.d("ViewHolderChart", "class is : " + chart.toString());
        }
    }

    /**
     *
     */
    static class ViewHolderHorizontalBarChart extends RecyclerView.ViewHolder {

        @NonNull
        private final HorizontalBarChart chart;

        ViewHolderHorizontalBarChart(@NonNull HorizontalBarChart chart) {
            super(chart);
            this.chart = chart;
        }
    }

    /**
     *
     */
    static class ViewHolderLineChart extends RecyclerView.ViewHolder {

        @NonNull
        private final LineChart chart;

        ViewHolderLineChart(@NonNull LineChart chart) {
            super(chart);
            this.chart = chart;
        }
    }

    /**
     *
     */
    static class ViewHolderRestrictedContent extends RecyclerView.ViewHolder {
        @NonNull
        private final View view;

        ViewHolderRestrictedContent(@NonNull View view) {
            super(view);
            this.view = view;
            this.view.setBackgroundColor(ThemeUtils.getStyleableColor(view.getContext(), R.styleable.CustomTheme_colorBackgroundDrawer));
        }
    }

    /**
     *
     */
    static class ViewHolderVideo extends RecyclerView.ViewHolder {

        @NonNull
        private final View view;

        @NonNull
        private final MediaController controller;

        ViewHolderVideo(@NonNull View view) {
            super(view);
            this.view = view;
            this.view.setBackgroundColor(ThemeUtils.getStyleableColor(view.getContext(), R.styleable.CustomTheme_colorBackgroundDrawer));
            this.controller = new MediaController(view.getContext());
            VideoView v = this.view.findViewById(R.id.videoView);
            v.setMediaController(this.controller);
        }

        VideoView getVideoView() {
            return view.findViewById(R.id.videoView);
        }

        MediaController getController() {
            return controller;
        }
    }
}
