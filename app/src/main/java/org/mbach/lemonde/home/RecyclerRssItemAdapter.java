package org.mbach.lemonde.home;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.squareup.picasso.Picasso;

import org.mbach.lemonde.R;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * RecyclerRssItemAdapter class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class RecyclerRssItemAdapter extends RecyclerView.Adapter<RecyclerRssItemAdapter.ViewHolder> implements View.OnClickListener {

    @NonNull
    private final List<RssItem> items;
    private OnItemClickListener onItemClickListener;

    private final Pattern itemTypePattern = Pattern.compile("^https://www.lemonde.fr/[\\w]+/([\\w]+)/.*$");

    RecyclerRssItemAdapter(@NonNull List<RssItem> items) {
        this.items = items;
    }

    RecyclerRssItemAdapter() {
        this.items = new ArrayList<>();
    }

    void setOnItemClickListener(OnItemClickListener onItemClickListener) {
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
        Picasso.with(holder.image.getContext()).load(item.getMediaContent()).into(holder.image);
        holder.itemView.setTag(item);
        Matcher itemType = itemTypePattern.matcher(item.getLink());
        if (itemType.find()) {
            if ("live".equals(itemType.group(1))) {
                holder.itemType.setImageResource(R.drawable.ic_live_48dp);
                holder.itemType.setVisibility(View.VISIBLE);
            } else if ("video".equals(itemType.group(1))) {
                holder.itemType.setImageResource(R.drawable.baseline_play_circle_outline_white_48dp);
                holder.itemType.setVisibility(View.VISIBLE);
            } else {
                holder.itemType.setVisibility(View.GONE);
            }
        } else {
            holder.itemType.setVisibility(View.GONE);
        }
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
        final ImageView image;

        @NonNull
        final ImageView itemType;

        @NonNull
        final TextView title;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            image = itemView.findViewById(R.id.rss_image);
            itemType = itemView.findViewById(R.id.rss_item_type);
            title = itemView.findViewById(R.id.rss_title);
        }
    }
}
