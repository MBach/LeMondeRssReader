package org.mbach.lemonde.article;

import android.content.Context;
import android.support.annotation.NonNull;
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

    public ScrollFeedbackRecyclerView(@NonNull Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    private void init() {
        ViewParent viewParent = getParent();
        if (viewParent instanceof CoordinatorLayout) {
            fab = ((CoordinatorLayout) viewParent).findViewById(R.id.fab);
        }
    }

    @Override
    public void onScrolled(int dx, int dy) {
        if (fab != null) {
            LinearLayoutManager layout = (LinearLayoutManager) getLayoutManager();
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
        super.setLayoutManager(layout);
        init();
    }
}
