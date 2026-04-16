import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { HTMLElement, parse } from 'node-html-parser'
import { JSX, useCallback, useContext, useEffect, useState } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { FlatList, Image, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Surface, Text, TouchableRipple, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

import CustomStatusBar from '@/src/components/CustomStatusBar'
import { FetchError } from '@/src/components/FetchError'
import { SettingsContext } from '@/src/context/SettingsContext'
import { useBottomSheet } from '@/src/context/useBottomSheet'
import { useWebViewFetch } from '@/src/hooks/useWebViewFetch'
import { useRouter } from 'expo-router'
import WebView from 'react-native-webview'
import { DefaultImageFeed, IconMic, IconPremium, IconVideo } from '../../../assets'
import { Api } from '../../../src/api'
import { ArticleType, ParsedRssItem, parseAndGuessURL } from '../../../src/types'

const regex = /<!\[CDATA\[(.*)+\]\]>/

const fetchFeed = async (uri: string): Promise<HTMLElement> => {
  console.log(`about to fetchFeed on uri="${uri}"`)
  const response = await Api.get(uri)
  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status}`)
  }
  const text = await response.text()
  return parse(text)
}

const useFeed = (uri: string | null) => {
  return useQuery({
    queryKey: uri ? ['feed', uri] : ['feed', 'disabled'],
    queryFn: async () => {
      if (!uri) {
        return null
      }
      console.log('useFeed > uri', uri)
      return fetchFeed(uri)
    },
    enabled: !!uri,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

function parseRssItems(items: HTMLElement[]): ParsedRssItem[] {
  let rssItems: ParsedRssItem[] = []
  for (const item of items) {
    let rssItem: ParsedRssItem = { title: '', description: '', link: '', uri: '' }
    for (let i = 0; i < item.childNodes.length; i++) {
      const htmlElement = item.childNodes[i] as HTMLElement
      if (!(htmlElement && htmlElement.rawTagName)) {
        continue
      }
      switch (htmlElement.rawTagName.toLowerCase()) {
        case 'guid':
          rssItem.link = htmlElement.text
          break
        case 'title':
          const title = regex.exec(htmlElement.text)
          rssItem.title = title && title.length === 2 ? title[1] : ''
          break
        case 'description':
          const description = regex.exec(htmlElement.text)
          rssItem.description = description?.length === 2 ? description[1] : ''
          break
        case 'media:content':
          let url = htmlElement.getAttribute('url')
          if (url) {
            rssItem.uri = url
          }
          break
      }
    }
    rssItems.push(rssItem)
  }
  console.log('parseRssItems > rssItems.length', rssItems.length)
  return rssItems
}

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export default function HomeScreen() {
  const [items, setItems] = useState<ParsedRssItem[]>([])
  const [premiumMap, setPremiumMap] = useState<Map<string, boolean>>(new Map())
  const sheetRef = useBottomSheet()

  const router = useRouter()

  const { colors } = useTheme()
  const window = useWindowDimensions()
  const settingsContext = useContext(SettingsContext)

  const feedUri = settingsContext.hydrated ? settingsContext.currentCategory.uri : null

  const { data, error, isFetched, isLoading, isRefetching, refetch } = useFeed(feedUri)

  const {
    fetch: fetchPremium,
    reset: resetPremium,
    html: premiumHtml,
    status: premiumStatus,
    webViewProps: premiumWebViewProps
  } = useWebViewFetch()

  // Kick off premium WebView fetch once RSS items are loaded
  useEffect(() => {
    if (!isFetched || items.length === 0) return
    const subPath = settingsContext.currentCategory.subPath ?? ''
    resetPremium()
    fetchPremium(`https://www.lemonde.fr/${subPath}`)
  }, [items, isFetched])

  // Reset premium state when the category changes
  useEffect(() => {
    resetPremium()
    setPremiumMap(new Map())
  }, [settingsContext.currentCategory.uri])

  useEffect(() => {
    if (data) {
      const items: HTMLElement[] = data.querySelectorAll('item')
      if (items && items.length > 0) {
        //console.log('useEffect > data changed, calling parseRssItems')
        setItems(parseRssItems(items))
      }
    }
  }, [data])

  /*
  useEffect(() => {
    console.log('useEffect > items.length', items.length)
  }, [items])

  useEffect(() => {
    console.log('useEffect > feedUri', feedUri)
  }, [feedUri])
  */

  // Parse premium icons from the WebView-delivered HTML
  useEffect(() => {
    if (premiumStatus !== 'done' || !premiumHtml) return
    const doc = parse(premiumHtml)
    const map = new Map<string, boolean>()

    const addHref = (href: string | undefined) => {
      if (!href) return
      const absolute = href.startsWith('http') ? href : `https://www.lemonde.fr${href}`
      map.set(absolute, true)
    }

    // Category pages: <a class="teaser__link" href="..."><span class="icon__premium">…</span></a>
    doc.querySelectorAll('span.icon__premium').forEach((icon) => {
      const parent = icon.parentNode as HTMLElement
      if (parent?.rawTagName === 'a') {
        addHref(parent.getAttribute('href'))
      }
    })

    // Home page: <div class="ds-card__premium"> inside <div class="ds-card__title"> which also contains <a class="ds-card__link">
    doc.querySelectorAll('div.ds-card__premium').forEach((card) => {
      const titleContainer = card.parentNode as HTMLElement
      const anchor = titleContainer?.querySelector('a.ds-card__link')
      addHref(anchor?.getAttribute('href'))
    })

    console.log('[HomeScreen] premium icons found:', map.size)
    setPremiumMap(map)
  }, [premiumStatus, premiumHtml])

  useEffect(() => {
    if (data && sheetRef && sheetRef.current) {
      sheetRef.current.collapse()
    }
  }, [data, sheetRef])

  const navigateTo = async (item: ParsedRssItem, type: ArticleType) => {
    const parsed = parseAndGuessURL(item.link)
    if (!parsed) return
    sheetRef?.current?.close()

    const { category, yyyy, mm, dd, title } = parsed

    switch (type) {
      case ArticleType.ARTICLE:
        router.push(`/(tabs)/(home)/${category}/article/${yyyy}/${mm}/${dd}/${title}`)
        break
      case ArticleType.LIVE:
        router.push(`/(tabs)/(home)/${category}/live/${yyyy}/${mm}/${dd}/${title}`)
        break
      case ArticleType.VIDEO:
        router.push(`/(tabs)/(home)/${category}/video/${yyyy}/${mm}/${dd}/${title}`)
        break
      case ArticleType.PODCAST:
        router.push(`/(tabs)/(home)/${category}/podcast/${yyyy}/${mm}/${dd}/${title}`)
        break
    }
  }

  const styles = StyleSheet.create({
    itemContainer: {
      flex: 1,
      flexDirection: settingsContext.fontScale > 1.5 ? 'column' : 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.elevation.level5
    },
    extraIconContainer: {
      flexDirection: 'row-reverse',
      margin: 4
    },
    imageBG: {
      resizeMode: 'cover',
      width: 120,
      height: 108,
      alignItems: 'flex-end',
      paddingTop: 4,
      paddingRight: 8
    },
    iconPremium: {
      width: 24,
      height: 24,
      backgroundColor: colors.primaryContainer,
      tintColor: colors.onPrimaryContainer
    }
  })

  useFocusEffect(
    useCallback(() => {
      // Small fix to avoid layout issues
      const timer = setTimeout(() => {
        sheetRef?.current?.snapToIndex(0)
      }, 350)
      return () => clearTimeout(timer)
    }, [sheetRef?.current])
  )

  /*useFocusEffect(
    useCallback(() => {
      if (isFetched) {
        refetch()
      }
    }, [refetch, isFetched])
  )*/

  useEffect(() => {
    console.log('useEffect > mounted')
    return () => {
      console.log('useEffect > unmounted')
    }
  }, [])

  const renderItem = ({ item }: { item: ParsedRssItem }) => {
    // Check if 2nd capture group is live/video/other
    const regex = /https:\/\/www\.lemonde\.fr\/([\w-]+)\/(\w+)\/.*/g
    const b = regex.exec(item.link)
    let type: ArticleType = ArticleType.ARTICLE
    if (b && b.length === 3) {
      if (b[2] === 'live') {
        type = ArticleType.LIVE
      } else if (b[2] === 'video') {
        type = ArticleType.VIDEO
      } else if (b[1] === 'podcasts') {
        type = ArticleType.PODCAST
      }
    }
    let extraIcons: React.JSX.Element[] = []
    if (premiumMap.get(item.link)) {
      extraIcons.push(
        <View key="premiumIcon" style={styles.extraIconContainer}>
          <Image source={IconPremium} style={styles.iconPremium} />
        </View>
      )
    }
    if (type === ArticleType.LIVE) {
      extraIcons.push(
        <View key="liveIcon" style={styles.extraIconContainer}>
          <Text variant="labelMedium" style={{ padding: 2, backgroundColor: colors.onError, color: colors.onErrorContainer }}>
            • Live
          </Text>
        </View>
      )
    } else if (type === ArticleType.VIDEO || type === ArticleType.PODCAST) {
      extraIcons.push(
        <View key="mediaIcon" style={styles.extraIconContainer}>
          <Image source={type === ArticleType.VIDEO ? IconVideo : IconMic} style={{ width: 24, height: 24, tintColor: colors.tertiary }} />
        </View>
      )
    }

    return (
      <TouchableRipple borderless rippleColor={colors.primary} onPress={() => navigateTo(item, type)}>
        <Surface elevation={0} style={styles.itemContainer}>
          <View style={{ display: 'flex', flexDirection: 'row' }}>
            <Image source={item.uri ? { uri: item.uri } : DefaultImageFeed} style={styles.imageBG} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ flex: 1, padding: 8, width: settingsContext.fontScale > 1.5 ? window.width : window.width - 120 }}>
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row-reverse' }}>{extraIcons}</View>
          </View>
        </Surface>
      </TouchableRipple>
    )
  }

  const renderContentLoader = () => {
    const size = Math.round((window.height - 26) / 108)
    let loaders: JSX.Element[] = []
    const d = (window.height - 26) / size - 1
    for (let i = 0; i < size; i++) {
      loaders.push(<Rect key={'r1-' + i} x="0" y={`${i * d}`} rx="0" ry="0" width="126" height="108" />)
      loaders.push(<Rect key={'r2-' + i} x="130" y={`${10 + i * d}`} rx="0" ry="0" width="250" height="15" />)
      loaders.push(<Rect key={'r3-' + i} x="130" y={`${40 + i * d}`} rx="0" ry="0" width="170" height="12" />)
    }
    return (
      <ContentLoader backgroundColor={colors.outline} foregroundColor={colors.background}>
        {loaders}
      </ContentLoader>
    )
  }

  return (
    <SafeAreaView style={{ marginBottom: -24 }}>
      <CustomStatusBar translucent={true} />
      {/* Hidden WebView for fetching JS-rendered premium icons */}
      {premiumWebViewProps && <WebView {...premiumWebViewProps} />}
      {isLoading ? (
        <View>{renderContentLoader()}</View>
      ) : error ? (
        <FetchError onRetry={refetch} />
      ) : (
        <FlatList
          data={items}
          extraData={items}
          renderItem={renderItem}
          keyExtractor={(item: ParsedRssItem) => item.link}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
    </SafeAreaView>
  )
}
