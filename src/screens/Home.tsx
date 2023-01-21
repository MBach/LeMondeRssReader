import React, { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, FlatList, Image, RefreshControl, StatusBar, StyleSheet, View, BackHandler } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/core'
import { useTheme, Appbar, Surface, Text, TouchableRipple, IconButton, Button } from 'react-native-paper'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { parse } from 'node-html-parser'
import { RouteProp, useFocusEffect } from '@react-navigation/native'

import { DefaultImageFeed, IconLive, IconMic, IconVideo, IconPremium } from '../assets'
import { SettingsContext } from '../context/SettingsContext'
import i18n from '../locales/i18n'
import Api from '../api'
import { ArticleType, MenuEntry, ParsedRssItem } from '../types'

const regex = /<!\[CDATA\[(.*)+\]\]>/

type ParamList = {
  params: MenuEntry | undefined
}

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export default function HomeScreen() {
  const [loading, setLoading] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [fetchFailed, setFetchFailed] = useState<boolean>(false)
  const [items, setItems] = useState([])
  //const [category, setCategory] = useState<MenuEntry | null>(null)

  const navigation = useNavigation()
  const route = useRoute<RouteProp<ParamList, 'params'>>()

  const theme = useTheme()
  const window = useWindowDimensions()
  const settingsContext = useContext(SettingsContext)

  const styles = StyleSheet.create({
    itemContainer: {
      flex: 1,
      flexDirection: settingsContext.fontScale > 1.5 ? 'column' : 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.elevation.level5
    },
    imageBG: {
      resizeMode: 'cover',
      width: 120,
      height: 108,
      alignItems: 'flex-end',
      paddingTop: 4,
      paddingRight: 8
    },
    image: {
      width: 32,
      height: 32
    },
    iconPremium: {
      position: 'absolute',
      width: 24,
      height: 24,
      bottom: 4,
      right: 4,
      backgroundColor: theme.colors.primaryContainer,
      tintColor: theme.colors.onPrimaryContainer
    }
  })

  useEffect(() => {
    if (loading) {
      console.log('useEffect > already loading...')
      return
    }
    console.log('useEffect > currentCategory changed')
    console.log(settingsContext.currentCategory)
    if (settingsContext.currentCategory) {
      fetchFeed(false)
    }
  }, [settingsContext.currentCategory])

  /*
  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        settingsContext.popCategories()
      }),
    [navigation]
  )
  */

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          console.log('can go back!')
          return false
        } else {
          console.log('pop?')
          settingsContext.popCategories()
          return true
        }
      }
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

      return () => subscription.remove()
    }, [settingsContext.currentCategory])
  )

  const refreshFeed = async () => {
    setRefreshing(true)
    await fetchFeed(true)
    setRefreshing(false)
  }

  const fetchFeed = async (isRefreshing: boolean) => {
    setFetchFailed(false)
    if (!isRefreshing) {
      setLoading(true)
    }
    const url = `https://www.lemonde.fr/${settingsContext.currentCategory?.uri}`
    console.log(`About to fetch feed at ${url}`)
    const response = await Api.get(url)
    setLoading(false)
    if (!response.ok) {
      setFetchFailed(true)
      return
    }
    const text = await response.text()
    const doc = parse(text)
    const nodeItems = doc.querySelectorAll('item')

    let map = new Map()
    for (const index in nodeItems) {
      let item: ParsedRssItem = { id: index, title: '', description: '', isRestricted: false, link: '', uri: '' }
      for (let i = 0; i < nodeItems[index].childNodes.length; i++) {
        const node = nodeItems[index].childNodes[i]
        if (!(node && node.tagName)) {
          continue
        }
        switch (node.tagName.toLowerCase()) {
          case 'guid':
            item.link = node.text
            break
          case 'title':
            const title = regex.exec(node.text)
            item.title = title && title.length === 2 ? title[1] : ''
            break
          case 'description':
            const description = regex.exec(node.text)
            item.description = description?.length === 2 ? description[1] : ''
            break
          case 'media:content':
            if (node.getAttribute('url')) {
              item.uri = node.getAttribute('url')
            }
            break
        }
      }
      map.set(item.link, item)
    }
    setItems(Array.from(map.values()))
    if (!isRefreshing) {
      setLoading(false)
    }
    getPremiumIcons(map)
  }

  const getPremiumIcons = (map: Map<string, ParsedRssItem>) => {
    let subPath = ''
    if (route.params?.subPath) {
      subPath = '/' + route.params.subPath
    }
    Api.get(`https://www.lemonde.fr${subPath}`)
      .then((res) => res.text())
      .then((page) => {
        const doc = parse(page)
        const articles = doc.querySelectorAll('.article, .teaser')
        for (const article of articles) {
          if (article.querySelector('span.icon__premium')) {
            const link = article.querySelector('a')
            const href = link?.getAttribute('href')
            if (link && href && map.has(href)) {
              let item = map.get(href)
              if (item) {
                item.isRestricted = true
                map.set(href, item)
              }
            }
          }
        }
        setItems(Array.from(map.values()))
      })
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    // Check if 2nd capture group is live/video/other
    const regex = /https:\/\/www\.lemonde\.fr\/([\w-]+)\/(\w+)\/.*/g
    const b = regex.exec(item.link)
    let icon = null
    let type: ArticleType = ArticleType.ARTICLE
    if (b && b.length === 3) {
      if (b[2] === 'live') {
        icon = IconLive
        type = ArticleType.LIVE
      } else if (b[2] === 'video') {
        icon = IconVideo
        type = ArticleType.VIDEO
      } else if (b[1] === 'podcasts') {
        icon = IconMic
        type = ArticleType.PODCAST
      }
    }
    return (
      <TouchableRipple
        borderless
        rippleColor={theme.colors.primary}
        onPress={async () => {
          const response = await Api.get(item.link)
          const d = parse(await response.text())
          settingsContext.setDoc(d)
          switch (type) {
            default:
            case ArticleType.ARTICLE:
            case ArticleType.PODCAST:
              navigation.navigate('Article', { item })
              break
            case ArticleType.LIVE:
              navigation.navigate('LiveTabs', { screen: 'LiveFact', params: { item } })
              break
            case ArticleType.VIDEO:
              navigation.navigate('Video', { item })
              break
          }
        }}>
        <Surface style={styles.itemContainer}>
          <View style={{ display: 'flex', flexDirection: 'row' }}>
            <Image source={item.uri ? { uri: item.uri } : DefaultImageFeed} style={styles.imageBG} />
            {icon && <Image source={icon} style={{ position: 'absolute', width: 32, height: 32, right: 8, top: 8 }} />}
          </View>
          <View style={{ display: 'flex' }}>
            <Text style={{ padding: 8, width: settingsContext.fontScale > 1.5 ? window.width : window.width - 120 }}>{item.title}</Text>
            {index > 0 && item.isRestricted && <Image source={IconPremium} style={styles.iconPremium} />}
          </View>
        </Surface>
      </TouchableRipple>
    )
  }

  const renderContentLoader = () => {
    let loaders = []
    const d = (window.height - 26) / 6
    for (let i = 0; i < 7; i++) {
      loaders.push(<Rect key={'r1-' + i} x="0" y={`${i * d}`} rx="0" ry="0" width="126" height={Math.floor(d)} />)
      loaders.push(<Rect key={'r2-' + i} x="130" y={`${10 + i * d}`} rx="0" ry="0" width="250" height="15" />)
      loaders.push(<Rect key={'r3-' + i} x="130" y={`${40 + i * d}`} rx="0" ry="0" width="170" height="12" />)
    }
    return (
      <ContentLoader
        backgroundColor={theme.colors.outline}
        foregroundColor={theme.colors.background}
        viewBox={`6 0 ${window.width} ${window.height}`}>
        {loaders}
      </ContentLoader>
    )
  }

  return (
    <Surface style={{ flex: 1 }}>
      <StatusBar backgroundColor={'rgba(0,0,0,0.5)'} translucent animated />
      <Appbar.Header>
        <Appbar.Action icon="menu" onPress={navigation.openDrawer} />
        {settingsContext.currentCategory && <Appbar.Content title={i18n.t(`feeds.${settingsContext.currentCategory.name}`)} />}
      </Appbar.Header>
      {loading ? (
        renderContentLoader()
      ) : fetchFailed ? (
        <View style={{ flex: 1, paddingHorizontal: 12, justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
          <Text variant="headlineSmall" numberOfLines={2} style={{ textAlign: 'center' }}>
            {i18n.t('home.fetchFailed')}
          </Text>
          <IconButton icon="network-strength-1-alert" size={80} />
          <Button
            buttonColor={theme.colors.secondary}
            textColor={theme.colors.onSecondary}
            style={{ marginTop: 24, padding: 8 }}
            onPress={() => {
              fetchFeed(false)
            }}>
            {i18n.t('home.retry')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          extraData={items}
          renderItem={renderItem}
          keyExtractor={(item: any, index: number) => index.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshFeed} />}
        />
      )}
    </Surface>
  )
}
