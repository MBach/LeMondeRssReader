package org.mbach.lemonde.favorites;

import android.graphics.drawable.Drawable;
import android.support.annotation.NonNull;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import org.mbach.lemonde.R;
import org.mbach.lemonde.ThemeUtils;
import org.mbach.lemonde.home.RssItem;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * FavoritesAdapter class.
 *
 * @author Matthieu BACHELIER
 * @since 2018-06
 */
class FavoritesAdapter extends RecyclerView.Adapter {

    private List<RssItem> items;

    /**
     * Add items to render.
     *
     * @param items list of items to display
     */
    void addItems(@NonNull List<RssItem> items) {
        this.items = items;
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
            case RssItem.ARTICLE_TYPE:
                return new ViewHolderArticle(LayoutInflater.from(parent.getContext()).inflate(R.layout.favorite_card, parent, false));
            case RssItem.DATE_GROUP_TYPE:
                return new ViewHolderDateGroup(new TextView(parent.getContext()));
        }
    }

    @Override
    public void onBindViewHolder(@NonNull final RecyclerView.ViewHolder holder, final int position) {
        RssItem model = items.get(position);
        if (model == null) {
            return;
        }
        switch (model.getType()) {
            case RssItem.ARTICLE_TYPE:
                ((ViewHolderArticle) holder).setId(model.getArticleId());
                ((ViewHolderArticle) holder).getTitle().setText(model.getTitle());
                ((ViewHolderArticle) holder).getCategory().setText(model.getCategory());
                break;
            case RssItem.DATE_GROUP_TYPE:
                SimpleDateFormat sdf = new SimpleDateFormat("EEEE d MMM yyyy", Locale.FRENCH);
                ((ViewHolderDateGroup) holder).getDate().setText(sdf.format(new Date(model.getPubDate())));
                break;
        }
    }

    /**
     *
     */
    static class ViewHolderDateGroup extends RecyclerView.ViewHolder {
        @NonNull
        private final TextView text;

        ViewHolderDateGroup(@NonNull View view) {
            super(view);
            this.text = (TextView) view;
            this.text.setPadding(16, 48, 16, 16);
        }

        @NonNull
        TextView getDate() {
            return this.text;
        }
    }

    /**
     *
     */
    static class ViewHolderArticle extends RecyclerView.ViewHolder {
        @NonNull
        private final View view;

        ViewHolderArticle(@NonNull View view) {
            super(view);
            this.view = view;
            Button button = this.view.findViewById(R.id.deleteFavoriteButton);
            Drawable background;
            if (ThemeUtils.isDarkTheme(view.getContext())) {
                background = view.getContext().getResources().getDrawable(R.drawable.baseline_delete_white_24);
            } else {
                background = view.getContext().getResources().getDrawable(R.drawable.baseline_delete_dark_24);
            }
            button.setBackgroundDrawable(background);
            this.view.setBackgroundColor(ThemeUtils.getStyleableColor(view.getContext(), R.styleable.CustomTheme_colorBackgroundDrawer));
        }

        /*int getId() {
            return view.getId();
        }*/

        void setId(int id) {
            view.setId(id);
        }

        TextView getTitle() {
            return view.findViewById(R.id.favorite_title);
        }

        TextView getCategory() {
            return view.findViewById(R.id.favorite_category);
        }
    }
}
