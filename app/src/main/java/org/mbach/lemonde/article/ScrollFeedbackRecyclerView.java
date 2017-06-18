package org.mbach.lemonde.article;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.design.widget.AppBarLayout;
import android.support.design.widget.CoordinatorLayout;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.util.AttributeSet;
import android.view.ViewParent;

import org.mbach.lemonde.R;

import mbanje.kurt.fabbutton.FabButton;

/**
 * ScrollFeedbackRecyclerView class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class ScrollFeedbackRecyclerView extends RecyclerView {
    //private static final String TAG = "ScrollFeedbackRV";

    private FabButton fab;
    private boolean collapsed;
    private AppBarLayout appBarLayout;

    public ScrollFeedbackRecyclerView(@NonNull Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    private void init() {
        ViewParent viewParent = getParent();
        if (viewParent instanceof CoordinatorLayout) {
            fab = ((CoordinatorLayout) viewParent).findViewById(R.id.fab);
            appBarLayout = ((CoordinatorLayout) viewParent).findViewById(R.id.app_bar_layout);
            appBarLayout.addOnOffsetChangedListener(new AppBarLayout.OnOffsetChangedListener() {
                @Override
                public void onOffsetChanged(AppBarLayout appBarLayout, int offset) {
                    collapsed = Math.abs(offset) == appBarLayout.getTotalScrollRange();
                }
            });
        }
    }

    @Override
    public void onScrolled(int dx, int dy) {
        LinearLayoutManager layout = (LinearLayoutManager) getLayoutManager();
        if (collapsed && layout.findFirstCompletelyVisibleItemPosition() == 0) {
            this.appBarLayout.setExpanded(true);
        }
        if (fab != null) {
            if (layout.findLastCompletelyVisibleItemPosition() == getLayoutManager().getItemCount() - 1) {
                fab.setVisibility(VISIBLE);
            } else {
                fab.setVisibility(INVISIBLE);
            }
        }
        super.onScrolled(dx, dy);
    }

    @Override
    public void setLayoutManager(LayoutManager layout) {
        if (!(layout instanceof LinearLayoutManager)) {
            throw new IllegalArgumentException(layout.toString() + " must be of type LinearLayoutManager");
        }
        init();
        super.setLayoutManager(layout);
    }
}
