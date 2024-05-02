import { useRoute } from '@react-navigation/core'
import React, { useEffect, useState } from 'react'
import { useWindowDimensions, ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Surface, Text } from 'react-native-paper'
import WebView from 'react-native-webview'
import parse, { HTMLElement } from 'node-html-parser'

import { ArticleHeader, ArticleHeaderParser, ParsedLink } from '../types'
import Api from '../api'
import CustomHeader from '../components/Header'

/**
 * @author Matthieu BACHELIER
 * @since 2020-04
 * @version 2.0
 */
export default function VideoScreen() {
  type VideoData = {
    id: string
    provider: string
  }

  const route = useRoute()
  const window = useWindowDimensions()

  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const styles = StyleSheet.create({
    paddingH: {
      paddingHorizontal: 8
    },
    videoContainer: {
      width: window.width,
      height: (window.width * 9) / 16
    }
  })

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    setLoading(true)

    let l: ParsedLink = route.params as ParsedLink
    const response = await Api.get(`https://www.lemonde.fr/${l.category}/article/${l.yyyy}/${l.mm}/${l.dd}/${l.title}`)
    const doc = parse(await response.text())
    const main = doc.querySelector('main')
    if (!main) {
      console.warn('cannot find <main> tag')
      return
    }

    // Category and other infos in the header
    const metas = Array.from(doc.querySelectorAll('meta')).filter((meta): meta is HTMLElement => meta instanceof HTMLElement)
    const parser = new ArticleHeaderParser()
    const a = parser.parse(metas)

    const videoContainer = main.querySelector('.article__special-container--video div')
    if (videoContainer) {
      const provider = videoContainer.getAttribute('data-provider')
      const id = videoContainer.getAttribute('data-id')
      if (id && provider) {
        setVideoData({ id, provider })
      }
    }

    setArticle(a)
    setLoading(false)
  }

  const renderVideoContainer = () => {
    if (!videoData) {
      return null
    }
    switch (videoData.provider) {
      case 'dailymotion':
        return <WebView source={{ uri: `https://www.dailymotion.com/embed/video/${videoData.id}` }} style={styles.videoContainer} />
      case 'youtube':
        return <WebView source={{ uri: `https://www.youtube.com/embed/${videoData.id}` }} style={styles.videoContainer} />
      default:
        return null
    }
  }

  return (
    <Surface style={{ flex: 1, paddingTop: StatusBar.currentHeight }}>
      {article?.isRestricted && <StatusBar backgroundColor={'rgba(255,196,0,1.0)'} barStyle="dark-content" animated />}
      {loading || !article ? (
        <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignContent: 'center', height: '100%' }} />
      ) : (
        <ScrollView>
          <CustomHeader article={article} loading={loading} />
          <Text variant="headlineSmall" style={styles.paddingH}>
            {article.title}
          </Text>
          <Text variant="titleMedium" style={styles.paddingH}>
            {article.description}
          </Text>
          <Text variant="bodyMedium" style={styles.paddingH}>
            {article.authors}
          </Text>
          <Text variant="bodyMedium" style={styles.paddingH}>
            {article.date}
          </Text>
          {renderVideoContainer()}
        </ScrollView>
      )}
      <View style={{ paddingBottom: 40 }} />
    </Surface>
  )
}
