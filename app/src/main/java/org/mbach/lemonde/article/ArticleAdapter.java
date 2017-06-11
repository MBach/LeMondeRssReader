package org.mbach.lemonde.article;

import android.support.annotation.NonNull;
import android.support.v7.widget.CardView;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.List;

/**
 * ArticleAdapter class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
class ArticleAdapter extends RecyclerView.Adapter {

    private List<Model> items;

    void insertItems(List<Model> items) {
        Log.d("ArticleAdapter", "items: " + items.size());
        if (this.items == null) {
            this.items = items;
        } else {
            List<Model> previousComments = new ArrayList<>();
            for (Model model : this.items) {
                if (model.getType() == Model.COMMENT_TYPE) {
                    previousComments.add(model);
                }
            }

            List<Model> nextComments = new ArrayList<>();
            for (Model model : items) {
                if (model.getType() == Model.COMMENT_TYPE) {
                    nextComments.add(model);
                }
            }

            nextComments.removeAll(previousComments);
            this.items.addAll(nextComments);
        }
        notifyDataSetChanged();
    }

    @Override
    public int getItemCount() {
        return items == null ? 0 : items.size();
    }

    @Override
    public int getItemViewType(int position) {
        if (items == null) {
            return -1;
        } else {
            switch (items.get(position).getType()) {
                case 0:
                    return Model.TEXT_TYPE;
                case 1:
                    return Model.IMAGE_TYPE;
                case 2:
                    return Model.TWEET_TYPE;
                case 3:
                    return Model.GRAPH_TYPE;
                case 4:
                    return Model.COMMENT_TYPE;
                default:
                    return -1;
            }
        }
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        switch (viewType) {
            default:
            case Model.TEXT_TYPE:
                return new ViewHolderText(new TextView(parent.getContext()));
            case Model.IMAGE_TYPE:
                ImageView imageView = new ImageView(parent.getContext());
                return new ViewHolderImage(imageView);
            case Model.TWEET_TYPE:
                LinearLayout layout = new LinearLayout(parent.getContext());
                layout.setOrientation(LinearLayout.VERTICAL);
                ViewGroup.LayoutParams params = new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );

                layout.addView(new TextView(parent.getContext()));
                layout.addView(new Button(parent.getContext()));
                CardView cardView = new CardView(parent.getContext());
                cardView.setLayoutParams(params);
                cardView.addView(layout);
                return new ViewHolderCardView(cardView);
            case Model.GRAPH_TYPE:
                BarChart barChart = new BarChart(parent.getContext());
                return new ViewHolderBarChart(barChart);
            case Model.COMMENT_TYPE:
                return new ViewHolderText(new TextView(parent.getContext()));
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

        switch (model.getType()) {
            case Model.TEXT_TYPE:
            case Model.COMMENT_TYPE:
                TextView textView = (TextView) model.getTheContent();
                ((ViewHolderText) holder).text.setText(textView.getText());
                ((ViewHolderText) holder).text.setPadding(textView.getPaddingLeft(), textView.getPaddingTop(), textView.getPaddingRight(), textView.getPaddingBottom());
                ((ViewHolderText) holder).text.setTypeface(textView.getTypeface());
                ((ViewHolderText) holder).text.setTextColor(textView.getCurrentTextColor());
                ((ViewHolderText) holder).text.setBackground(textView.getBackground());
                if (textView.getBackground() != null) {
                    ((ViewHolderText) holder).text.setAllCaps(true);
                }
                ((ViewHolderText) holder).text.setLayoutParams(lp);
                ((ViewHolderText) holder).text.setTextSize(TypedValue.COMPLEX_UNIT_PX, textView.getTextSize());
                break;
            case Model.IMAGE_TYPE:
                String imageURI = (String) model.getTheContent();
                ((ViewHolderImage) holder).image.setLayoutParams(lp);
                Picasso.with(((ViewHolderImage) holder).image.getContext()).load(imageURI).into(((ViewHolderImage) holder).image);
                break;
            case Model.TWEET_TYPE:
                CardView cardView = (CardView) model.getTheContent();
                TextView tweet = (TextView) cardView.getChildAt(0);
                TextView link = (TextView) cardView.getChildAt(1);
                ((ViewHolderCardView) holder).getTweet().setText(tweet.getText());
                ((ViewHolderCardView) holder).getLink().setText(link.getText());
                break;
            case Model.GRAPH_TYPE:
                BarChart barChart = (BarChart) model.getTheContent();
                ((ViewHolderBarChart) holder).barChart.setLayoutParams(lp2);
                ((ViewHolderBarChart) holder).barChart.setData(barChart.getData());
                break;
        }
    }

    /**
     *
     */
    public static class ViewHolderText extends RecyclerView.ViewHolder {
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
    public static class ViewHolderImage extends RecyclerView.ViewHolder {
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
    public static class ViewHolderCardView extends RecyclerView.ViewHolder {
        @NonNull
        private final CardView cardView;

        ViewHolderCardView(@NonNull CardView view) {
            super(view);
            cardView = view;
        }

        TextView getTweet() {
            LinearLayout layout = (LinearLayout) cardView.getChildAt(0);
            return (TextView) layout.getChildAt(0);
        }
        Button getLink() {
            LinearLayout layout = (LinearLayout) cardView.getChildAt(0);
            return (Button) layout.getChildAt(1);
        }
    }
    /**
     *
     */
    public static class ViewHolderBarChart extends RecyclerView.ViewHolder {
        @NonNull
        private final BarChart barChart;

        ViewHolderBarChart(@NonNull BarChart view) {
            super(view);
            barChart = view;
            barChart.setPinchZoom(false);
            barChart.setMaxVisibleValueCount(10);
            barChart.setDrawGridBackground(false);
            XAxis xAxis = barChart.getXAxis();
            xAxis.setEnabled(false);
            YAxis rightAxis = barChart.getAxisRight();
            rightAxis.setEnabled(false);
        }
    }
}
