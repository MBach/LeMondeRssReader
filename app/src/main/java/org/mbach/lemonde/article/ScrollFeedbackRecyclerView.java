package org.mbach.lemonde.article;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.util.AttributeSet;

import java.lang.ref.WeakReference;

public class ScrollFeedbackRecyclerView extends RecyclerView {
    private WeakReference<Callbacks> mCallbacks;

    public ScrollFeedbackRecyclerView(@NonNull Context context) {
        super(context);
        if (!isInEditMode()) {
            attachCallbacks(context);
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
        if (((LinearLayoutManager)getLayoutManager()).findFirstCompletelyVisibleItemPosition() == 0) {
            // Log.e(getClass().getSimpleName(), "index 0 visible");
            if (mCallbacks != null && mCallbacks.get().isAppBarCollapsed()) {
                mCallbacks.get().setExpanded(true);
            }
        }
        super.onScrolled(dx, dy);
    }

    @Override
    public void setLayoutManager(LayoutManager layout) {
        if(!(layout instanceof LinearLayoutManager)) {
            throw new IllegalArgumentException(layout.toString() + " must be of type LinearLayoutManager");
        }
        super.setLayoutManager(layout);
    }

    private void attachCallbacks(@NonNull Context context) {
        try {
            mCallbacks = new WeakReference<>((Callbacks)context);
        } catch (ClassCastException e) {
            throw new ClassCastException(context.toString() + " must implement ScrollFeedbackRecyclerView.Callbacks");
        }
    }

    interface Callbacks {
        boolean isAppBarCollapsed();
        void setExpanded(boolean expanded);
    }
}
