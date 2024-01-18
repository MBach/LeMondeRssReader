import React, { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, Image, Linking, ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import { useTheme, ActivityIndicator, Button, Card, Surface, Text } from 'react-native-paper'
import WebView from 'react-native-webview'
import { useRoute } from '@react-navigation/core'
import { RouteProp } from '@react-navigation/native'
import parse from 'node-html-parser'
import ky from 'ky'
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import Header from '../components/Header'
import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'
import { HomeStackParamList } from '../navigation/AppContainer'
import { ExtentedRssItem } from '../types'
import DynamicNavbar from '../DynamicNavbar'

const regex = /https:\/\/img\.lemde.fr\/\d+\/\d+\/\d+\/\d+\/\d+\/(\d+)\/(\d+)\/.*/

const styles = StyleSheet.create({
  paragraph: {
    paddingHorizontal: 8,
    marginTop: 8
  },
  paddingH: {
    paddingHorizontal: 8
  },
  imgCaption: {
    position: 'absolute',
    bottom: -2,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  podcastContainer: {
    width: '100%',
    height: 460
  }
})

type ArticleScreenRouteProp = RouteProp<HomeStackParamList, 'Article'>

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export default function ArticleScreen() {
  const route = useRoute<ArticleScreenRouteProp>()
  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()
  const [item, setItem] = useState<ExtentedRssItem>(route.params.item)

  const [paragraphes, setParagraphes] = useState([])
  const [loading, setLoading] = useState(true)
  const window = useWindowDimensions()

  useEffect(() => {
    init()
  }, [settingsContext.doc])

  useEffect(() => {
    if (settingsContext.keepScreenOn) {
      DynamicNavbar.setKeepScreenOn(true)
      return () => {
        DynamicNavbar.setKeepScreenOn(false)
      }
    }
  }, [settingsContext.keepScreenOn])

  const extractContent = (node: any, contents: any) => {
    // recursive call
    if (node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        extractContent(node.childNodes[i], contents)
      }
    }
    if (!node.tagName) {
      return
    }
    switch (node.tagName.toLowerCase()) {
      case 'div':
        if (node.classNames && node.classNames.length > 0) {
          if (node.classNames.includes('multimedia-embed') && node.childNodes[0]) {
            const dataWidgetSrc = node.childNodes[0].getAttribute('data-widget-src')
            if (dataWidgetSrc) {
              contents.push({ type: 'podcast', uri: dataWidgetSrc })
            }
          } else if (node.classNames.includes('twitter-tweet')) {
          }
        }
        break
      case 'h2':
        contents.push({ type: 'h2', text: node.text })
        break
      case 'p':
        if (node.classNames && node.classNames.length > 0) {
          if (node.classNames.includes('article__paragraph')) {
            contents.push({ type: 'paragraph', text: node.text })
          }
        }
        break
      case 'figure':
        const img = node.querySelector('img')
        if (img) {
          let imgSrc = img.getAttribute('src')
          if (!imgSrc) {
            imgSrc = img.getAttribute('data-src')
          }
          let caption = null
          if (imgSrc) {
            const figcaption = node.querySelector('figcaption')
            if (figcaption && figcaption.text) {
              caption = figcaption.text
            }
          } else {
            break
          }
          const b = regex.exec(imgSrc)
          let ratio
          if (b && b.length === 3) {
            ratio = b[1] / b[2]
          } else {
            ratio = 1.5
          }
          contents.push({ type: 'img', uri: imgSrc, ratio, caption })
        }
        break
    }
  }

  const init = async () => {
    setLoading(true)
    if (!settingsContext.doc) {
      if (route.params?.item.link) {
        const response = await ky.get(route.params.item.link)
        const d = parse(await response.text())
        settingsContext.setDoc(d)
      } else {
        return
      }
    }

    let d: ExtentedRssItem = { ...item }
    const main = settingsContext?.doc?.querySelector('main')

    // Header
    // Check if user has open this Article from the Home or from an external App like Firefox
    if (route.params?.item) {
      d.link = route.params.item.link
      d.title = route.params.item.title
      d.description = route.params.item.description
    } else if (!!main) {
      /// fixme
      //d.link = url
      d.title = main.querySelector('h1')?.rawText
      d.description = main.querySelector('p.article__desc')?.text.trim()
    }

    // Category
    const metas = settingsContext?.doc.querySelectorAll('meta')
    for (const meta of metas) {
      const property = meta.getAttribute('property')
      if ('og:article:section' === property) {
        d.category = meta.getAttribute('content')
      } else if ('og:article:author' === property) {
        d.authors = meta.getAttribute('content')
      } else if ('og:article:content_tier' === property) {
        const isLocked = meta.getAttribute('content')
        d.isRestricted = isLocked === 'locked'
      }
      if (!route.params?.item?.uri && 'og:image' === property) {
        d.imgUri = meta.getAttribute('content')
        console.log(d.imgUri)
      }
    }

    const longform: HTMLElement | null = settingsContext?.doc?.getElementById('Longform')
    if (!!longform) {
      d.authors = ''
      const metasAuthors = settingsContext?.doc?.doc.querySelectorAll('.meta__authors')
      for (const metasAuthor of metasAuthors) {
        d.authors = d.authors.concat(metasAuthor.querySelector('a.article__author-link')?.text.trim())
      }
    }

    let date = main.querySelector('span.meta__date')
    if (date) {
      d.date = date.rawText
    } else {
      d.date = main.querySelector('p.meta__publisher')?.text
    }
    d.readTime = main.querySelector('.meta__reading-time')?.lastChild.rawText

    // Paragraphes and images
    const article = main.querySelector('article')
    let par: any[] = []
    for (let i = 0; i < article.childNodes.length; i++) {
      extractContent(article.childNodes[i], par)
    }

    setItem(d)
    setParagraphes(par)
    setLoading(false)
  }

  const renderParagraphes = () =>
    paragraphes.map((p: any, index: number) => {
      switch (p.type) {
        case 'h2':
          return (
            <Text variant="titleLarge" key={index} style={styles.paragraph}>
              {p.text}
            </Text>
          )
        case 'img':
          return (
            <View key={index} style={{ marginHorizontal: 8 }}>
              <Image source={{ uri: p.uri }} style={{ width: window.width - 16, height: (window.width - 16) / p.ratio }} />
              {p.caption && (
                <Text variant="bodySmall" style={styles.imgCaption}>
                  {p.caption}
                </Text>
              )}
            </View>
          )
        case 'paragraph':
          return (
            <Text variant="bodyMedium" key={index} style={styles.paragraph}>
              {p.text}
            </Text>
          )
        case 'podcast':
          return <WebView key={index} source={{ uri: p.uri }} style={styles.podcastContainer} />
        default:
          return false
      }
    })

  const renderRestrictedCard = () =>
    item.isRestricted && (
      <Card style={{ margin: 8, backgroundColor: colors.elevation.level2 }}>
        <Card.Content>
          <Text variant="bodyMedium">{i18n.t('article.restricted')}</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={() => Linking.openURL('https://abo.lemonde.fr/')}>
            {i18n.t('article.register')}
          </Button>
        </Card.Actions>
      </Card>
    )

  return (
    <Surface style={{ flex: 1 }}>
      {settingsContext.hasDynamicStatusBarColor && item.isRestricted && (
        <StatusBar backgroundColor={'rgba(255,196,0,1.0)'} barStyle="dark-content" animated />
      )}
      <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
        <Header article={item} loading={loading} />
        <Text variant="headlineSmall" style={styles.paddingH}>
          {item.title}
        </Text>
        <Text variant="titleMedium" style={{ ...styles.paddingH, color: colors.tertiary }}>
          {item.description}
        </Text>
        {loading ? (
          <ActivityIndicator style={{ minHeight: 200, justifyContent: 'center', alignContent: 'center' }} />
        ) : (
          <>
            <Text variant="bodyMedium" style={{ ...styles.paddingH, color: colors.onSurfaceVariant }}>
              {item.authors}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <Text variant="bodySmall" style={{ ...styles.paddingH, color: colors.onSurfaceVariant }}>
                {item.date}
              </Text>
              {item.readTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text variant="bodySmall" style={{ marginRight: 8, color: colors.onSurfaceVariant }}>
                    •
                  </Text>
                  <Icon name="timer-outline" color={colors.onSurfaceVariant} size={16} style={{ marginRight: 4 }} />
                  <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                    {item.readTime}
                  </Text>
                </View>
              )}
            </View>
            {renderParagraphes()}
            {renderRestrictedCard()}
          </>
        )}
        <View style={{ paddingBottom: 40 }} />
      </ScrollView>
    </Surface>
  )
}
