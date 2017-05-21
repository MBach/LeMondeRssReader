package org.mbach.lemonde.article;

import android.support.annotation.NonNull;
import android.support.v7.widget.RecyclerView;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import com.squareup.picasso.Picasso;

import org.mbach.lemonde.R;

import java.util.List;

public class ArticleAdapter extends RecyclerView.Adapter {

    private static final String TAG = "ArticleAdapter";

    private final List<Model> items;

    public ArticleAdapter(List<Model> items) {
        this.items = items;
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    @Override
    public int getItemViewType(int position) {
        switch (items.get(position).getType()) {
            case 0:
                return Model.TEXT_TYPE;
            case 1:
                return Model.IMAGE_TYPE;
            default:
                return -1;
        }
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        switch (viewType) {
            case Model.TEXT_TYPE:
                return new ViewHolder1(new TextView(parent.getContext()));
            case Model.IMAGE_TYPE:
                ImageView imageView = new ImageView(parent.getContext());
                imageView.setImageResource(R.drawable.avatar);
                return new ViewHolder2(imageView);
            case Model.BLANK_TYPE:
                return new ViewHolder3(new View(parent.getContext()));
            default:
                return new ViewHolder3(new View(parent.getContext()));
        }
    }

    @Override
    public void onBindViewHolder(@NonNull final RecyclerView.ViewHolder holder, final int position) {

        Model model = items.get(position);
        if (model == null) {
            return;
        }
        holder.getItemViewType();
        switch (model.getType()) {
            case Model.TEXT_TYPE:
                TextView textView = (TextView) model.getTheContent();

                ((ViewHolder1) holder).text.setText(textView.getText());
                ((ViewHolder1) holder).text.setPadding(textView.getPaddingLeft(), textView.getPaddingTop(), textView.getPaddingRight(), textView.getPaddingBottom());
                ((ViewHolder1) holder).text.setTypeface(textView.getTypeface());
                ((ViewHolder1) holder).text.setTextColor(textView.getCurrentTextColor());
                ((ViewHolder1) holder).text.setTextSize(TypedValue.COMPLEX_UNIT_PX, textView.getTextSize());
                break;
            case Model.IMAGE_TYPE:
                String imageURI = (String) model.getTheContent();
                RecyclerView.LayoutParams lp = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                ((ViewHolder2) holder).image.setLayoutParams(lp);
                Picasso.with(((ViewHolder2) holder).image.getContext()).load(imageURI).into(((ViewHolder2) holder).image);
                break;
            case Model.BLANK_TYPE:
                View view = (View) model.getTheContent();
                ((ViewHolder3) holder).view.setPadding(view.getPaddingLeft(), view.getPaddingTop(), view.getPaddingRight(), view.getPaddingBottom());
                break;
        }
    }

    public static class ViewHolder1 extends RecyclerView.ViewHolder {
        @NonNull
        public final TextView text;

        ViewHolder1(@NonNull View view) {
            super(view);
            this.text = (TextView) view;
        }
    }

    public static class ViewHolder2 extends RecyclerView.ViewHolder {
        @NonNull
        public final ImageView image;

        ViewHolder2(@NonNull View view) {
            super(view);
            this.image = (ImageView) view;
        }
    }

    public static class ViewHolder3 extends RecyclerView.ViewHolder {
        @NonNull
        public final View view;

        ViewHolder3(@NonNull View view) {
            super(view);
            this.view = view;
        }
    }
}
