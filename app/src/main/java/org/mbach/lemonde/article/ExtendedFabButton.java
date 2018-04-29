package org.mbach.lemonde.article;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.view.animation.Interpolator;
import android.view.animation.ScaleAnimation;

import org.mbach.lemonde.R;

import mbanje.kurt.fabbutton.FabButton;

/**
 * ExtendedFabButton class adds motion to Floating Action Button.
 *
 * @author Cícero Moura
 * @link https://stackoverflow.com/questions/27922191/floating-action-button-animation
 * @since 2017-08
 */
public class ExtendedFabButton extends FabButton {

    private static final int FAB_ANIM_DURATION = 200;

    public ExtendedFabButton(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public void hide() {
        // Only use scale animation if FAB is visible
        if (getVisibility() == View.VISIBLE) {
            // Pivots indicate where the animation begins from
            float pivotX = getPivotX() + getTranslationX();
            float pivotY = getPivotY() + getTranslationY();

            // Animate FAB shrinking
            ScaleAnimation anim = new ScaleAnimation(1, 0, 1, 0, pivotX, pivotY);
            anim.setDuration(FAB_ANIM_DURATION);
            anim.setInterpolator(getInterpolator());
            startAnimation(anim);
        }
        setVisibility(View.INVISIBLE);
    }

    public void show() {

        // Set FAB's translation
        animate().setInterpolator(getInterpolator()).setDuration(FAB_ANIM_DURATION)
                .translationX(0).translationY(0);

        // Only use scale animation if FAB is hidden
        if (getVisibility() != View.VISIBLE) {

            ScaleAnimation anim;
            // If pivots are 0, that means the FAB hasn't been drawn yet so just use the center of the FAB
            if (getPivotX() == 0 || getPivotY() == 0) {
                anim = new ScaleAnimation(0, 1, 0, 1, Animation.RELATIVE_TO_SELF, 0.5f,
                        Animation.RELATIVE_TO_SELF, 0.5f);
            } else {
                anim = new ScaleAnimation(0, 1, 0, 1, getPivotX(), getPivotY());
            }

            // Animate FAB expanding
            anim.setDuration(FAB_ANIM_DURATION);
            anim.setInterpolator(getInterpolator());
            startAnimation(anim);
        }
        setVisibility(View.VISIBLE);
    }

    private Interpolator getInterpolator() {
        return AnimationUtils.loadInterpolator(getContext(), R.interpolator.fab_interpolator);
    }
}
