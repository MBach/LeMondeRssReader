package org.mbach.lemonde.home;

import android.support.annotation.NonNull;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import com.squareup.picasso.Picasso;

import org.mbach.lemonde.R;

import java.util.ArrayList;
import java.util.List;

/**
 * RecyclerRssItemAdapter class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class RecyclerRssItemAdapter extends RecyclerView.Adapter<RecyclerRssItemAdapter.ViewHolder> implements View.OnClickListener {

    @NonNull
    private static String TAG = "RecyclerRssItemAdapter";

    private final List<RssItem> items;
    private OnItemClickListener onItemClickListener;

    public RecyclerRssItemAdapter(List<RssItem> items) {
        this.items = items;
    }

    public RecyclerRssItemAdapter() {
        this.items = new ArrayList<>();
    }

    public void setOnItemClickListener(OnItemClickListener onItemClickListener) {
        this.onItemClickListener = onItemClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.activity_main_rss_item, parent, false);
        v.setOnClickListener(this);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        RssItem item = items.get(position);
        holder.title.setText(item.getTitle());
        holder.image.setImageBitmap(null);
        Picasso.with(holder.image.getContext()).load(item.getEnclosure()).into(holder.image);
        holder.itemView.setTag(item);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    @Override
    public void onClick(@NonNull final View v) {
        onItemClickListener.onItemClick(v, (RssItem) v.getTag());
    }

    public interface OnItemClickListener {
        void onItemClick(View view, RssItem viewModel);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        @NonNull
        public final ImageView image;
        @NonNull
        public final TextView title;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            image = (ImageView) itemView.findViewById(R.id.rss_image);
            title = (TextView) itemView.findViewById(R.id.rss_title);
        }
    }
}
