import { useEffect, useState } from 'react'
import { useWindowDimensions, StatusBar, StyleSheet, View, SafeAreaView } from 'react-native'
import { useRoute } from '@react-navigation/core'
import { ActivityIndicator, Text, useTheme } from 'react-native-paper'
import WebView from 'react-native-webview'
import parse, { HTMLElement } from 'node-html-parser'
import { ScrollViewWithHeaders } from '@codeherence/react-native-header'

import { ArticleHeader, ArticleHeaderParser, ParsedLink } from '../types'
import { Api } from '../api'
import { HeaderComponent } from '../components/Header'
import { FetchError } from '../components/FetchError'

/**
 * @author Matthieu BACHELIER
 * @since 2020-04
 * @version 2.0
 */
export function VideoScreen() {
  type VideoData = {
    id: string
    provider: string
  }

  const route = useRoute()
  const window = useWindowDimensions()
  const { colors } = useTheme()

  const [loading, setLoading] = useState<boolean>(true)
  const [fetchFailed, setFetchFailed] = useState<boolean>(false)
  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [videoData, setVideoData] = useState<VideoData | null>(null)

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
    if (!route.params) {
      console.warn('no params!')
      return
    }
    setFetchFailed(false)
    try {
      const l: ParsedLink = route.params as ParsedLink
      const response = await Api.get(`${l.category}/article/${l.yyyy}/${l.mm}/${l.dd}/${l.title}`)
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
    } catch (error) {
      setFetchFailed(true)
      setLoading(false)
    }
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
    <SafeAreaView style={{ flex: 1 }}>
      {article?.isRestricted && <StatusBar backgroundColor={'rgba(255,196,0,1.0)'} barStyle="dark-content" />}
      {fetchFailed ? (
        <FetchError onRetry={init} />
      ) : loading || !article ? (
        <ActivityIndicator style={{ flexGrow: 1, justifyContent: 'center' }} color={colors.primary} size={40} />
      ) : (
        <ScrollViewWithHeaders HeaderComponent={(props) => <HeaderComponent {...props} article={article} />}>
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
        </ScrollViewWithHeaders>
      )}
      <View style={{ paddingBottom: 40 }} />
    </SafeAreaView>
  )
}
