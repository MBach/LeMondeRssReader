## Introduction

This App for Android 6.0 Marshmallow and later features how to read RSS stream from one website, and does some complex [Web scraping](https://en.wikipedia.org/wiki/Web_scraping). It renders the items in the feed directly in native Android components, such as [TextView](https://developer.android.com/reference/android/widget/TextView.html), [ImageView](https://developer.android.com/reference/android/widget/ImageView.html)

This App was also built to be as fastest and simple as possible. Material design guidelines were applied so you'll find:
* A navigation drawer with a header (see this [tutorial](https://developer.android.com/training/implementing-navigation/nav-drawer.html))
* A [SwipeRefreshLayout](https://developer.android.com/reference/android/support/v4/widget/SwipeRefreshLayout.html) layout to simply refresh the RSS feed
* A collapsing toolbar layout when you're consulting an article from the feed: expanded toolbar with header image is fading to simple toolbar
* Settings activity lets you customize the article you're currently reading, by excluding unnecessary content (like tweets), to leverage written content instead
* ArticleActivity is using a [RecyclerView](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.html) where items are layout vertically. It has a complex [RecyclerView.Adapter] which holds at least more than one [ViewHolder](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.ViewHolder.html)

## Requirements

A smartphone at least on Android 6.0

## Download

You can get the app directly on GitHub, here is the [v1.0](https://github.com/MBach/LeMondeRssReader/releases/download/v1.0/LeMondeRssReader-1.0.apk)

## Screenshots
![Main page](https://raw.githubusercontent.com/MBach/LeMondeRssReader/gh-pages/screenshots/main.png)

![Article](https://raw.githubusercontent.com/MBach/LeMondeRssReader/gh-pages/screenshots/article.png)

![Drawer](https://raw.githubusercontent.com/MBach/LeMondeRssReader/gh-pages/screenshots/drawer.png)

## Support or Contact

You would like to translate this App in your language, or submit a bug / feature request? Please contribute!

### You can contribute also by these means:

bitcoin:39RBokXr4V9FPpuF7v1bM6PYcbgRRApp9W
