import { useCallback, useContext, useEffect, useState, type FC } from 'react'
import { useWindowDimensions, FlatList, Image, RefreshControl, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/core'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { useTheme, Surface, Text, TouchableRipple } from 'react-native-paper'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { parse, HTMLElement } from 'node-html-parser'

import { DefaultImageFeed, IconMic, IconVideo, IconPremium } from '../assets'
import { SettingsContext } from '../context/SettingsContext'
import { Api } from '../api'
import { ArticleType, MainStackNavigation, ParsedRssItem, parseAndGuessURL } from '../types'
import { FetchError } from '../components/FetchError'
import { CustomStatusBar } from '../components/CustomStatusBar'
import { useBottomSheet } from '../context/useBottomSheet'
import { KyResponse } from 'ky'

const regex = /<!\[CDATA\[(.*)+\]\]>/

const fetchFeed = async (uri: string): Promise<HTMLElement> => {
  const response = await Api.get(uri)
  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status}`)
  }
  const text = await response.text()
  return parse(text)
}

const useFeed = (uri: string | undefined) =>
  useQuery({
    queryKey: ['feed', uri],
    queryFn: () => fetchFeed(uri!),
    enabled: !!uri,
    staleTime: 1000 * 60
  })

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export function HomeScreen() {
  const [items, setItems] = useState<ParsedRssItem[]>([])
  const [loadingPremium, setLoadingPremium] = useState<boolean>(false)
  const [checkPremiumIcons, setCheckPremiumIcons] = useState<boolean>(false)
  const sheetRef = useBottomSheet()

  const navigation = useNavigation<MainStackNavigation>()

  const { colors } = useTheme()
  const window = useWindowDimensions()
  const settingsContext = useContext(SettingsContext)

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

  const { data, error, isLoading, isRefetching, refetch } = useFeed(settingsContext.currentCategory?.uri)

  useEffect(() => {
    if (data) {
      setCheckPremiumIcons(false)
      const items: HTMLElement[] = data.querySelectorAll('item')
      let rssItems: ParsedRssItem[] = []
      for (const item of items) {
        let rssItem: ParsedRssItem = { title: '', description: '', isRestricted: false, link: '', uri: '' }
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
      setItems(rssItems)
    }
  }, [data])

  useEffect(() => {
    if (items.length > 0 && !checkPremiumIcons && !loadingPremium) {
      setLoadingPremium(true)
      Api.get(settingsContext.currentCategory?.subPath || '')
        .then((res: KyResponse) => res.text())
        .then((page: string) => {
          const doc = parse(page)
          const premiumIcons = doc.querySelectorAll('span.icon__premium')
          const rssItemListWithIcon: ParsedRssItem[] = [...items]
          premiumIcons.forEach((premiumIcon) => {
            const parentAnchor = premiumIcon.parentNode
            if (parentAnchor && parentAnchor.tagName === 'A') {
              const href = parentAnchor.getAttribute('href')
              if (href) {
                const rssItem = rssItemListWithIcon.find((item) => item.link === href)
                if (rssItem) {
                  rssItem.isRestricted = true
                }
              }
            }
          })
          setItems(rssItemListWithIcon)
        })
        .catch((error) => {
          console.warn('Error fetching premium icons:', error)
        })
        .finally(() => {
          setLoadingPremium(false)
        })
    }
  }, [items, checkPremiumIcons])

  useEffect(() => {
    if (data) {
      sheetRef?.current?.collapse()
    }
  }, [data, sheetRef])

  const navigateTo = async (item: ParsedRssItem, type: ArticleType) => {
    const parsed = parseAndGuessURL(item.link)
    if (parsed) {
      sheetRef?.current?.close()
      navigation.navigate(type, parsed)
    }
  }

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
    if (item.isRestricted) {
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
    let loaders: JSX.Element[] = []
    const d = (window.height - 26) / 6
    for (let i = 0; i < 7; i++) {
      loaders.push(<Rect key={'r1-' + i} x="0" y={`${i * d}`} rx="0" ry="0" width="126" height={Math.floor(d)} />)
      loaders.push(<Rect key={'r2-' + i} x="130" y={`${10 + i * d}`} rx="0" ry="0" width="250" height="15" />)
      loaders.push(<Rect key={'r3-' + i} x="130" y={`${40 + i * d}`} rx="0" ry="0" width="170" height="12" />)
    }
    return (
      <ContentLoader backgroundColor={colors.outline} foregroundColor={colors.background} viewBox={`24 0 ${window.width} ${window.height}`}>
        {loaders}
      </ContentLoader>
    )
  }

  return (
    <SafeAreaView>
      <CustomStatusBar translucent={true} backgroundColor={colors.surface} />
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
