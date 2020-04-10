import React, { useEffect, useState } from 'react'
import { useWindowDimensions, FlatList, Image, ImageBackground, RefreshControl, StyleSheet, StatusBar } from 'react-native'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useTheme, Appbar, Snackbar, Surface, Text, TouchableRipple } from 'react-native-paper'
import ky from 'ky'
import { DOMParser } from 'xmldom'

import { IconLive, IconVideo } from '../assets/Icons'
import i18n from '../locales/i18n'

// Check if 2nd capture group is live/video/other
const regex = /https:\/\/www\.lemonde\.fr\/(\w+)\/(\w+)\/.*/g

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function HomeScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [items, setItems] = useState([])

  const { colors } = useTheme()
  const window = useWindowDimensions()

  const styles = StyleSheet.create({
    itemContainer: {
      flex: 1,
      flexDirection: 'row',
      height: 108,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    imageBG: {
      width: 120,
      height: 108,
      alignItems: 'flex-end',
      paddingTop: 4,
      paddingRight: 8,
    },
    image: {
      width: 32,
      height: 32,
    },
  })

  useEffect(() => {
    fetchFeed(route?.params?.uri, false)
  }, [route?.params?.uri])

  const refreshFeed = async () => {
    setRefreshing(true)
    await fetchFeed(route?.params?.uri, true)
    setRefreshing(false)
  }

  const fetchFeed = async (uri, isRefreshing) => {
    if (!isRefreshing) {
      setLoading(true)
    }
    const response = await ky.get(`https://www.lemonde.fr/${uri ? uri : 'rss/une.xml'}`)
    if (!response.ok) {
      setFetchFailed(true)
      return
    }
    const doc = new DOMParser().parseFromString(await response.text(), 'application/xml')
    let objs = []
    const items = doc.documentElement.getElementsByTagName('item')
    for (let i = 0; i < items.length; i++) {
      let item = {}
      for (let j = 0; j < items[i].childNodes.length; j++) {
        const node = items[i].childNodes[j]
        switch (node.nodeName) {
          case 'title':
            item.title = node.textContent
            break
          case 'link':
            item.link = node.textContent
            break
          case 'media:content':
            item.uri = node.getAttribute('url')
            break
        }
      }
      objs.push(item)
    }
    setItems(objs)
    if (!isRefreshing) {
      setLoading(false)
    }
  }

  const renderItem = ({ item }) => {
    const b = regex.exec(item.link)
    let icon = null,
      isLive = false
    if (b && b.length === 3) {
      if (b[2] === 'live') {
        icon = IconLive
        isLive = true
      } else if (b[2] === 'video') {
        icon = IconVideo
      }
    }
    return (
      <TouchableRipple
        borderless
        rippleColor={colors.accent}
        onPress={() =>
          navigation.navigate('ArticleBottomTabsNavigator', {
            url: item.link,
            isLive,
          })
        }>
        <Surface style={styles.itemContainer}>
          <ImageBackground source={{ uri: item.uri }} style={styles.imageBG}>
            {icon && <Image source={icon} style={styles.image} />}
          </ImageBackground>
          <Text style={{ padding: 8, width: window.width - 120 }}>{item.title}</Text>
        </Surface>
      </TouchableRipple>
    )
  }

  const renderContentLoader = () => {
    let loaders = []
    const d = (window.height + 24) / 7
    for (let i = 0; i < 8; i++) {
      loaders.push(<Rect key={'r1-' + i} x="0" y={`${i * d}`} rx="0" ry="0" width="126" height={Math.floor(d) - 1} />)
      loaders.push(<Rect key={'r2-' + i} x="130" y={`${10 + i * d}`} rx="0" ry="0" width="250" height="15" />)
      loaders.push(<Rect key={'r3-' + i} x="130" y={`${40 + i * d}`} rx="0" ry="0" width="170" height="12" />)
    }
    return (
      <ContentLoader backgroundColor={colors.border} foregroundColor={colors.background} viewBox={`6 0 ${window.width} ${window.height}`}>
        {loaders}
      </ContentLoader>
    )
  }

  return (
    <Surface
      style={{
        flex: 1,
      }}>
      <StatusBar color="translucent" />
      <Appbar.Header>
        <Appbar.Action icon="menu" onPress={navigation.openDrawer} />
        <Appbar.Content title={route?.params?.title ? route?.params?.title : i18n.t('feeds.latestNews')} />
      </Appbar.Header>
      {loading ? (
        renderContentLoader()
      ) : (
        <FlatList
          data={items}
          extraData={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshFeed} />}
        />
      )}
      <Snackbar visible={fetchFailed} duration={Snackbar.DURATION_LONG}>
        {i18n.t('home.fetchFailed')}
      </Snackbar>
    </Surface>
  )
}

export default HomeScreen
