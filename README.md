## Introduction

This App for Android 4.0.3 Ice Cream Sandwich and later (Android P) features how to read RSS stream from one website, and does some complex [Web scraping](https://en.wikipedia.org/wiki/Web_scraping). It renders the items in the feed directly in native Android components, such as [TextView](https://developer.android.com/reference/android/widget/TextView.html), [ImageView](https://developer.android.com/reference/android/widget/ImageView.html)

This App was also built to be as fastest and simple as possible. Material design guidelines were applied so you'll find:
* A navigation drawer with a header (see this [tutorial](https://developer.android.com/training/implementing-navigation/nav-drawer.html))
* A [SwipeRefreshLayout](https://developer.android.com/reference/android/support/v4/widget/SwipeRefreshLayout.html) layout to simply refresh the RSS feed
* A collapsing toolbar layout when you're consulting an article from the feed: expanded toolbar with header image is fading to simple toolbar
* [Settings activity](https://developer.android.com/reference/android/preference/PreferenceActivity.html) lets you customize the article you're currently reading, by excluding unnecessary content (like tweets), to leverage written content instead
* ArticleActivity is using a [RecyclerView](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.html) where items are layout vertically. It has a complex [RecyclerView.Adapter](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.Adapter.html) which holds at least more than one [ViewHolder](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.ViewHolder.html)
* For Android 7.1 (API 25): [dynamic App Shortcuts](https://developer.android.com/guide/topics/ui/shortcuts.html#dynamic) to quickly open the category that you're reading the most!

### Comments

Comments are loaded automatically in the same view when one has reached the bottom of the article.

### Dynamic theme

In addition, this App has 2 themes. Dark Theme is the default theme, but it can be easily switched to Light Theme in settings. To do so, these themes are defined in [styles.xml](https://developer.android.com/guide/topics/ui/themes.html) and some utility functions are used to paint or repaint remaining items accordingly. In layouts, colors aren't hardcoded and are using extensively ```?attr/myColor```

```xml
<android.support.v7.widget.Toolbar
    android:id="@+id/toolbar"
    android:layout_width="match_parent"
    android:layout_height="?attr/actionBarSize"
    android:background="?attr/colorPrimary" />
```

Dynamic widgets built by parsing to render a web page are in pure Java code, so the trick is to retrieve the color from the current applied style. These custom colors must be declared as styleable attributes in ```attrs.xml``` file.

```java
private int getStyleableColor(int resourceId) {
    int theme;
    if (ThemeUtils.isDarkTheme(getBaseContext())) {
        theme = R.style.DarkTheme;
    } else {
        theme = R.style.LightTheme;
    }
    TypedArray ta = obtainStyledAttributes(theme, R.styleable.CustomTheme);
    int styleableColor = ta.getColor(resourceId, 0);
    ta.recycle();
    return styleableColor;
}
```

### Dynamic App Shortcuts

Introduced with Android 7.1, App Shortcuts are a way to provide a link to specific content with a long press on the App Icon. In LeMondeRssReader, it's implemented on how often one is using the navbar: every time one is clicking on a category, this action is tracked to make basic statistics.

An embedded SQLite database stores this:

```java
    private static final String CREATE_DATABASE = "CREATE TABLE " + TABLE_STATS + " ("
            + COL_CATEGORY + " INTEGER PRIMARY KEY, "
            + COL_TIMES_OPENED + " INTEGER NOT NULL, "
            + COL_LAST_OPENED + " INTEGER NOT NULL);";
```

Another small class has only 2 methods in order to track just what is useful for the user:

```java
    void saveSelectedEntry(int categoryId) { ... }
    List<Integer> getSavedEntries() { ... }
```

## Requirements

A smartphone at least on Android 4.0.3 (API 15) ! That should not be a real problem...

## Download

<a href="https://f-droid.org/packages/org.mbach.lemonde/">
<img src="https://f-droid.org/badge/get-it-on.png" alt="Get it on F-Droid" height="80"></a>

Or you can get the app directly on GitHub, here is the [v1.11](https://github.com/MBach/LeMondeRssReader/releases/download/v1.11/LeMondeRssReader-1.11.apk)

## Video
[Overview of the App](https://mbach.github.io/LeMondeRssReader/video/video_1.mp4)

## Screenshots
![Main page](https://mbach.github.io/LeMondeRssReader/screenshots/main.jpg)

![Article](https://mbach.github.io/LeMondeRssReader/screenshots/article.jpg)

![Tweet](https://mbach.github.io/LeMondeRssReader/screenshots/tweet.jpg)

![Restricted content](https://mbach.github.io/LeMondeRssReader/screenshots/restricted_article.jpg)

![Favorites](https://mbach.github.io/LeMondeRssReader/screenshots/favorites.jpg)

![Dynamic App Shortcut](https://mbach.github.io/LeMondeRssReader/screenshots/dynamic_app_shortcut.jpg)

## Support or Contact

You would like to translate this App in your language, or submit a bug / feature request? Please contribute!

### You can contribute also by these means:

bitcoin:39RBokXr4V9FPpuF7v1bM6PYcbgRRApp9W
