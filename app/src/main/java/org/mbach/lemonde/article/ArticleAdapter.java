package org.mbach.lemonde.article;

import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.text.Html;
import android.util.Log;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.MediaController;
import android.widget.TextView;
import android.widget.VideoView;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.BarLineChartBase;
import com.github.mikephil.charting.charts.HorizontalBarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.squareup.picasso.Picasso;

import org.mbach.lemonde.Constants;
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

    private ArrayList<Model> items;

    /**
     * Add items to render.
     *
     * @param items list of items (incl. comments) to display
     */
    void addItems(@NonNull ArrayList<Model> items) {
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
            case Model.LIVE_TYPE:
                return new ViewHolderLive(LayoutInflater.from(parent.getContext()).inflate(R.layout.live_card, parent, false));
            case Model.FACTS_TYPE:
                return new ViewHolderFact(LayoutInflater.from(parent.getContext()).inflate(R.layout.fact_card, parent, false));
            case Model.BUTTON_TYPE:
                return new ViewHolderRestrictedContent(LayoutInflater.from(parent.getContext()).inflate(R.layout.connect_card, parent, false));
            case Model.VIDEO_TYPE:
                return new ViewHolderVideo(LayoutInflater.from(parent.getContext()).inflate(R.layout.video_view, parent, false));
            case GraphModel.GRAPH_TYPE_BARS:
            case GraphModel.GRAPH_TYPE_COLUMNS:
            case GraphModel.GRAPH_TYPE_LINE:
                return new ViewHolderChart(LayoutInflater.from(parent.getContext()).inflate(R.layout.graph_card, parent, false));
        }
    }

    @Override
    public void onBindViewHolder(@NonNull final RecyclerView.ViewHolder holder, final int position) {

        Model model = items.get(position);
        if (model == null) {
            return;
        }
        if (model instanceof GraphModel) {
            GraphModel graphModel = (GraphModel) model;
            ViewHolderChart chart = (ViewHolderChart) holder;
            chart.getTitle().setText(graphModel.getTitle());
            chart.getSubtitle().setText(graphModel.getSubtitle());
            chart.getSource().setContentDescription(graphModel.getSource());
            switch (graphModel.getType()) {
                case GraphModel.GRAPH_TYPE_BARS:
                    HorizontalBarChart horizontalBarChart = (HorizontalBarChart) graphModel.getChart();
                    chart.getHorizontalBarChart().setVisibility(View.VISIBLE);
                    chart.getHorizontalBarChart().setData(horizontalBarChart.getData());
                    chart.getHorizontalBarChart().getData().setHighlightEnabled(false);
                    chart.getHorizontalBarChart().getXAxis().setValueFormatter(horizontalBarChart.getXAxis().getValueFormatter());
                    break;
                case GraphModel.GRAPH_TYPE_COLUMNS:
                    BarChart barChart = (BarChart) graphModel.getChart();
                    chart.getBarChart().setVisibility(View.VISIBLE);
                    chart.getBarChart().setData(barChart.getData());
                    chart.getBarChart().getData().setHighlightEnabled(false);
                    chart.getBarChart().getXAxis().setValueFormatter(barChart.getXAxis().getValueFormatter());
                    break;
                case GraphModel.GRAPH_TYPE_LINE:
                    LineChart lineChart = (LineChart) graphModel.getChart();
                    chart.getLineChart().setVisibility(View.VISIBLE);
                    chart.getLineChart().setData(lineChart.getData());
                    chart.getLineChart().getData().setHighlightEnabled(false);
                    chart.getLineChart().getXAxis().setValueFormatter(lineChart.getXAxis().getValueFormatter());
                    break;
            }
        } else {
            RecyclerView.LayoutParams lp = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
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
                    vh.text.setBackground(textView.getBackground());

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
                case Model.VIDEO_TYPE:
                    Uri videoURI = (Uri) model.getTheContent();
                    ViewHolderVideo viewHolderVideo = (ViewHolderVideo) holder;
                    viewHolderVideo.getVideoView().setVideoURI(videoURI);
                    viewHolderVideo.getVideoView().setTag(videoURI);
                    viewHolderVideo.getController().show();
                    viewHolderVideo.getVideoView().start();
                    Log.d(TAG, "pos = " + viewHolderVideo.getVideoView().getCurrentPosition());
                    break;
                case Model.LIVE_TYPE:
                    ViewHolderLive viewHolder = (ViewHolderLive) holder;
                    LiveModel liveModel = (LiveModel) model;
                    viewHolder.setAuthorText(liveModel.getAuthorName());
                    viewHolder.setDateText(liveModel.getDate());
                    Picasso.with((viewHolder.avatarView.getContext())).load(liveModel.getAuthorAvatar()).into(viewHolder.avatarView);

                    ArrayList<LiveModel.SubModel> subModels = liveModel.getSubModels();
                    Context context = viewHolder.authorView.getContext();
                    viewHolder.clearContent();
                    for (LiveModel.SubModel subModel : subModels) {
                        if (subModel instanceof LiveModel.Paragraph) {
                            String par = ((LiveModel.Paragraph) subModel).getHtml();
                            // Deleting links
                            par = par.replaceAll("<a[^>]*>", "");
                            // Deleting images
                            par = par.replaceAll("<img[^>]*>", "");
                            TextView paragraph = new TextView(context);
                            fromHtml(paragraph, par);
                            paragraph.setPadding(0, 0, 0, Constants.PADDING_BOTTOM);
                            paragraph.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.live_body));
                            viewHolder.addContent(paragraph);
                        }
                        if (subModel instanceof LiveModel.Quote) {
                            String par = ((LiveModel.Quote) subModel).getHtml();
                            // Deleting links
                            par = par.replaceAll("<a[^>]*>", "");
                            TextView paragraph = new TextView(context);
                            fromHtml(paragraph, par);
                            paragraph.setPadding(0, 0, 0, Constants.PADDING_BOTTOM);
                            paragraph.setTextSize(TypedValue.COMPLEX_UNIT_SP, context.getResources().getDimension(R.dimen.live_body));
                            viewHolder.addContent(paragraph);
                        }
                        if (subModel instanceof LiveModel.Image) {
                            ImageView image = new ImageView(context);
                            Picasso.with(context).load(((LiveModel.Image) subModel).getUrl()).into(image);
                            viewHolder.addContent(image);
                        }


                    }

                    break;
            }
        }
    }

    ArrayList<Model> getItems() {
        return items;
    }

    /**
     * fromHtml to deal with older SDK.
     *
     * @param textView the textView to fill
     * @param html     raw string
     */
    private void fromHtml(@NonNull TextView textView, String html) {
        if (html == null) {
            return;
        }
        if (android.os.Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            textView.setText(Html.fromHtml(html));
        } else {
            textView.setText(Html.fromHtml(html, Html.FROM_HTML_MODE_COMPACT));
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
    static class ViewHolderLive extends RecyclerView.ViewHolder {
        @NonNull
        private final TextView authorView;
        @NonNull
        private final TextView dateView;
        @NonNull
        private final ImageView avatarView;
        @NonNull
        private final LinearLayout contentLayout;

        ViewHolderLive(@NonNull View view) {
            super(view);
            this.authorView = view.findViewById(R.id.live_author);
            this.dateView = view.findViewById(R.id.live_date);
            this.avatarView = view.findViewById(R.id.live_avatar);
            this.contentLayout = view.findViewById(R.id.live_content);
        }

        public void setAuthorText(String text) {
            this.authorView.setText(text);
        }

        public void setDateText(String text) {
            this.dateView.setText(text);
        }

        public void addContent(View view) {
            this.contentLayout.addView(view);
        }

        public void clearContent() {
            this.contentLayout.removeAllViews();
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
    static class ViewHolderChart extends RecyclerView.ViewHolder {
        @NonNull
        private final View view;

        ViewHolderChart(@NonNull View view) {
            super(view);
            this.view = view;
            this.view.setBackgroundColor(ThemeUtils.getStyleableColor(view.getContext(), R.styleable.CustomTheme_colorBackgroundDrawer));
            HorizontalBarChart horizontalBarChart = view.findViewById(R.id.horizontalBarChartView);
            horizontalBarChart.getLegend().setTextColor(ThemeUtils.getStyleableColor(horizontalBarChart.getContext(), R.styleable.CustomTheme_defaultText));
            horizontalBarChart.getDescription().setEnabled(false);

            BarChart barChart = view.findViewById(R.id.barChartView);
            barChart.getLegend().setTextColor(ThemeUtils.getStyleableColor(barChart.getContext(), R.styleable.CustomTheme_defaultText));
            barChart.getDescription().setEnabled(false);

            LineChart lineChart = view.findViewById(R.id.lineChartView);
            lineChart.getLegend().setTextColor(ThemeUtils.getStyleableColor(lineChart.getContext(), R.styleable.CustomTheme_defaultText));
            lineChart.getDescription().setEnabled(false);
        }

        /**
         * @param chart the chart
         * @return styled chart
         */
        private BarLineChartBase styledChart(@NonNull BarLineChartBase chart) {
            XAxis x = chart.getXAxis();
            x.setTextColor(ThemeUtils.getStyleableColor(chart.getContext(), R.styleable.CustomTheme_defaultText));
            x.setDrawGridLines(false);
            x.setGranularity(1f);
            x.setGranularityEnabled(true);
            YAxis yLeft = chart.getAxisLeft();
            yLeft.setEnabled(false);
            YAxis yRight = chart.getAxisRight();
            yRight.setTextColor(ThemeUtils.getStyleableColor(chart.getContext(), R.styleable.CustomTheme_defaultText));
            yRight.setGranularity(1f);
            return chart;
        }

        TextView getTitle() {
            return view.findViewById(R.id.graphTitle);
        }

        TextView getSubtitle() {
            return view.findViewById(R.id.graphSubtitle);
        }

        HorizontalBarChart getHorizontalBarChart() {
            HorizontalBarChart horizontalBarChart = view.findViewById(R.id.horizontalBarChartView);
            return (HorizontalBarChart) styledChart(horizontalBarChart);
        }

        BarChart getBarChart() {
            BarChart barChart = view.findViewById(R.id.barChartView);
            return (BarChart) styledChart(barChart);
        }

        LineChart getLineChart() {
            LineChart lineChart = view.findViewById(R.id.lineChartView);
            return (LineChart) styledChart(lineChart);
        }

        Button getSource() {
            return view.findViewById(R.id.graphSource);
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

        @NonNull
        MediaController getController() {
            return controller;
        }
    }
}
