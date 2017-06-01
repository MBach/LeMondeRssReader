package org.mbach.lemonde.article;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.design.widget.CoordinatorLayout;
import android.support.design.widget.FloatingActionButton;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.view.ViewParent;

import org.mbach.lemonde.R;
import com.github.jorgecastilloprz.FABProgressCircle;
import java.lang.ref.WeakReference;

/**
 * ScrollFeedbackRecyclerView class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class ScrollFeedbackRecyclerView extends RecyclerView {
    private static final String TAG = "ScrollFeedbackRV";

    private FloatingActionButton fab;
    private FABProgressCircle fabProgressCircle;
    private WeakReference<Callbacks> callbacks;

    public ScrollFeedbackRecyclerView(@NonNull Context context) {
        super(context);
        if (!isInEditMode()) {
            attachCallbacks(context);
        }
    }

    private void initFab() {
        ViewParent viewParent = getParent();
        if (viewParent instanceof CoordinatorLayout) {
            fab = (FloatingActionButton) ((CoordinatorLayout) viewParent).findViewById(R.id.fab);
            fabProgressCircle = (FABProgressCircle) ((CoordinatorLayout) viewParent).findViewById(R.id.fabProgressCircle);
        }
    }

    public ScrollFeedbackRecyclerView(@NonNull Context context, AttributeSet attrs) {
        super(context, attrs);
        if (!isInEditMode()) {
            attachCallbacks(context);
        }
    }

    @Override
    public void onScrolled(int dx, int dy) {
        LinearLayoutManager layout = (LinearLayoutManager) getLayoutManager() ;
        if (layout.findFirstCompletelyVisibleItemPosition() == 0) {
            if (callbacks != null && callbacks.get().isAppBarCollapsed()) {
                callbacks.get().setExpanded(true);
            }
        }
        if (layout.findLastCompletelyVisibleItemPosition() == getLayoutManager().getItemCount() - 1) {
            fab.show(new FloatingActionButton.OnVisibilityChangedListener() {
                @Override
                public void onShown(FloatingActionButton fab) {
                    super.onShown(fab);
                    fabProgressCircle.setVisibility(VISIBLE);
                }
            });

        } else {
            fab.hide(new FloatingActionButton.OnVisibilityChangedListener() {
                @Override
                public void onHidden(FloatingActionButton fab) {
                    super.onShown(fab);
                    fabProgressCircle.setVisibility(INVISIBLE);
                }
            });
        }
        super.onScrolled(dx, dy);
    }

    @Override
    public void setLayoutManager(LayoutManager layout) {
        if (!(layout instanceof LinearLayoutManager)) {
            throw new IllegalArgumentException(layout.toString() + " must be of type LinearLayoutManager");
        }
        initFab();
        super.setLayoutManager(layout);
    }

    private void attachCallbacks(@NonNull Context context) {
        try {
            callbacks = new WeakReference<>((Callbacks)context);
        } catch (ClassCastException e) {
            throw new ClassCastException(context.toString() + " must implement ScrollFeedbackRecyclerView.Callbacks");
        }
    }

    interface Callbacks {
        boolean isAppBarCollapsed();
        void setExpanded(boolean expanded);
    }
}
