import React, { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, Image, Linking, ScrollView, Share, StatusBar, StyleSheet, View } from 'react-native'
import { StackActions } from '@react-navigation/native'
import { SharedElement } from 'react-navigation-shared-element'
import {
  useTheme,
  ActivityIndicator,
  Button,
  Caption,
  Card,
  Headline,
  IconButton,
  Paragraph,
  Snackbar,
  Subheading,
  Surface,
  Title,
} from 'react-native-paper'

import { IconTimer, DefaultImageFeed } from '../assets/Icons'
import { SettingsContext } from '../context/SettingsContext'
import i18n from '../locales/i18n'
import WebView from 'react-native-webview'

/**
 * @author Matthieu BACHELIER
 * @since 2020-04
 * @version 1.0
 */
export default function VideoScreen({ navigation, route, doc, url }) {
  const { colors } = useTheme()
  const { settingsContext } = useContext(SettingsContext)
  const [shared, setShared] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)

  const [data, setData] = useState({ title: route.params?.item?.title, description: route.params?.item?.description })
  const [videoData, setVideoData] = useState({})

  const [item, setItem] = useState({ id: route.params?.item?.id, uri: route.params?.item?.uri })

  const [loading, setLoading] = useState(true)
  const window = useWindowDimensions()

  const styles = StyleSheet.create({
    paddingH: {
      paddingHorizontal: 8,
    },
    imageHeader: {
      width: window.width,
      height: 200,
      resizeMode: 'contain',
    },
  })

  useEffect(() => {
    init()
  }, [doc])

  const init = async () => {
    setLoading(true)
    if (!doc) {
      return
    }

    //const share = await settingsContext.getShare()
    //const isShared = share === null || share === '1'
    //setShared(isShared)

    let d = { ...data }
    const main = doc.querySelector('main')

    // Header
    // Check if user has open this Article from the Home or from an external App like Firefox
    if (route.params?.item) {
      d.link = route.params.item.link
      d.title = route.params.item.title
      d.description = route.params.item.description
    } else {
      d.link = url
      d.title = main.querySelector('h1')?.rawText
      d.description = main.querySelector('p.article__desc')?.text.trim()
    }

    // Category
    const metas = doc.querySelectorAll('meta')
    for (const meta of metas) {
      const property = meta.getAttribute('property')
      if ('og:article:section' === property) {
        d.category = meta.getAttribute('content')
      } else if ('og:article:author' === property) {
        d.authors = meta.getAttribute('content')
      }
      if (!route.params?.item?.uri && 'og:image' === property) {
        d.imgUri = meta.getAttribute('content')
      }
    }

    setItem({ ...item, imgUri: d.imgUri, title: d.title, description: d.description, category: d.category, link: d.link })

    let date = main.querySelector('span.meta__date')
    if (date) {
      d.date = date.rawText
    } else {
      d.date = main.querySelector('p.meta__publisher')?.text
    }

    setIsFavorite(await settingsContext.hasFavorite(d.link))

    // Paragraphes and images
    const videoContainer = main.querySelector('.article__special-container--video div')
    if (videoContainer) {
      const provider = videoContainer.getAttribute('data-provider')
      const id = videoContainer.getAttribute('data-id')
      if (id && provider) {
        setVideoData({ id, provider })
      }
    }

    setData(d)
    setLoading(false)
  }

  const shareContent = async () => {
    try {
      await Share.share({ title: `Le monde.fr : ${item.title}`, message: data.link })
    } catch (error) {
      // nothing
    }
  }

  const toggleFavorite = async () => {
    setIsFavorite(!isFavorite)
    await settingsContext.toggleFavorite(item)
    setSnackbarVisible(true)
  }

  const renderHeader = () => (
    <View style={{ flexDirection: 'row', height: 200 }}>
      {item && item.uri ? (
        <View style={{ position: 'absolute' }}>
          <SharedElement id={`item.${item.id}.photo`}>
            <Image source={{ uri: item.uri }} style={styles.imageHeader} />
          </SharedElement>
        </View>
      ) : (
        <Image source={data.imgUri ? { uri: data.imgUri } : DefaultImageFeed} style={{ position: 'absolute', ...styles.imageHeader }} />
      )}
      <IconButton icon="arrow-left" size={20} onPress={() => navigation.dispatch(StackActions.replace('Drawer'))} />
      <View style={{ flexGrow: 1 }} />
      {!loading && shared && <IconButton icon="share-variant" size={20} onPress={shareContent} />}
      {!loading && (
        <IconButton
          animated
          icon={isFavorite ? 'star' : 'star-outline'}
          size={20}
          color={isFavorite ? colors.accent : colors.text}
          onPress={toggleFavorite}
        />
      )}
    </View>
  )

  const renderVideoContainer = () => {
    if (videoData.provider) {
      if (videoData.provider === 'dailymotion') {
        return (
          <WebView
            source={{ uri: `https://www.dailymotion.com/embed/video/${videoData.id}` }}
            style={{ marginTop: 20, width: window.width, height: window.width / 2 }}
          />
        )
      } // others
    }
    return false
  }

  return (
    <Surface style={{ flex: 1 }}>
      {data.isRestricted && <StatusBar backgroundColor={'rgba(255,196,0,1.0)'} barStyle="dark-content" animated />}
      <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
        {renderHeader()}
        <Headline style={styles.paddingH}>{data.title}</Headline>
        <Subheading style={styles.paddingH}>{data.description}</Subheading>
        {loading ? (
          <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignContent: 'center', height: '100%' }} />
        ) : (
          <>
            <Paragraph style={styles.paddingH}>{data.authors}</Paragraph>
            <Paragraph style={styles.paddingH}>{data.date}</Paragraph>
          </>
        )}
        {renderVideoContainer()}
      </ScrollView>
    </Surface>
  )
}
