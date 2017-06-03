## Introduction

This App for Android 6.0 Marshmallow and later features how to read RSS stream from one website, and does some complex [Web scraping](https://en.wikipedia.org/wiki/Web_scraping). It renders the items in the feed directly in native Android components, such as [TextView](https://developer.android.com/reference/android/widget/TextView.html), [ImageView](https://developer.android.com/reference/android/widget/ImageView.html)

This App was also built to be as fastest and simple as possible. Material design guidelines were applied so you'll find:
* A navigation drawer with a header (see this [tutorial](https://developer.android.com/training/implementing-navigation/nav-drawer.html))
* A [SwipeRefreshLayout](https://developer.android.com/reference/android/support/v4/widget/SwipeRefreshLayout.html) layout to simply refresh the RSS feed
* A collapsing toolbar layout when you're consulting an article from the feed: expanded toolbar with header image is fading to simple toolbar
* [Settings activity](https://developer.android.com/reference/android/preference/PreferenceActivity.html) lets you customize the article you're currently reading, by excluding unnecessary content (like tweets), to leverage written content instead
* ArticleActivity is using a [RecyclerView](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.html) where items are layout vertically. It has a complex [RecyclerView.Adapter](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.Adapter.html) which holds at least more than one [ViewHolder](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.ViewHolder.html)

### Comments

Comments are loaded in the same view (ArticleActivity) and new comments are fetched using a custom [FloatingActionButton](https://developer.android.com/reference/android/support/design/widget/FloatingActionButton.html): the [FABProgressCircle](https://github.com/JorgeCastilloPrz/FABProgressCircle) which holds a circular progress bar when button is triggered

Every comment page can be fetched by clicking this button until all comments are displayed: the URL is computed internally and the user has nothing to do

## Requirements

A smartphone at least on Android 6.0

## Download

You can get the app directly on GitHub, here is the [v1.1](https://github.com/MBach/LeMondeRssReader/releases/download/v1.1/LeMondeRssReader-1.1.apk)

## Screenshots
![Main page](https://mbach.github.io/LeMondeRssReader/screenshots/main.jpg)

![Article](https://mbach.github.io/LeMondeRssReader/screenshots/article.jpg)

![Article](https://mbach.github.io/LeMondeRssReader/screenshots/fab_and_chart.png)

## Support or Contact

You would like to translate this App in your language, or submit a bug / feature request? Please contribute!

### You can contribute also by these means:

bitcoin:39RBokXr4V9FPpuF7v1bM6PYcbgRRApp9W
