import { useLocalSearchParams } from 'expo-router'
import parse, { HTMLElement } from 'node-html-parser'
import { useEffect, useState } from 'react'
import { StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native'
import { ActivityIndicator, Text, useTheme } from 'react-native-paper'
import WebView from 'react-native-webview'

import { SafeAreaView } from 'react-native-safe-area-context'
import { FetchError } from '../components/FetchError'
import { HeaderComponent } from '../components/Header'
import { useWebViewFetch } from '../hooks/useWebViewFetch'
import { ArticleHeader, ArticleHeaderParser } from '../types'

/**
 * @author Matthieu BACHELIER
 * @since 2020-04
 * @version 3.0
 */
export default function VideoScreen() {
  type VideoData = {
    id: string
    provider: string
  }

  const { category, slug } = useLocalSearchParams<{ category: string; slug: string[] }>()
  const [yyyy, mm, dd, title] = Array.isArray(slug) ? slug : []

  const window = useWindowDimensions()
  const { colors } = useTheme()

  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [videoData, setVideoData] = useState<VideoData | null>(null)

  const { fetch, reset, html, status, webViewProps } = useWebViewFetch()

  const videoUrl = category && yyyy && mm && dd && title ? `https://www.lemonde.fr/${category}/article/${yyyy}/${mm}/${dd}/${title}` : null

  const styles = StyleSheet.create({
    paddingH: {
      paddingHorizontal: 8
    },
    videoContainer: {
      width: window.width,
      height: (window.width * 9) / 16
    }
  })

  // Kick off fetch when params change
  useEffect(() => {
    if (!videoUrl) {
      console.log('[VideoScreen] params not ready yet:', { category, slug })
      return
    }
    reset()
    fetch(videoUrl)
  }, [videoUrl])

  // Parse HTML once received
  useEffect(() => {
    if (status !== 'done' || !html) return
    try {
      const doc = parse(html)
      const main = doc.querySelector('main')
      if (!main) {
        console.warn('[VideoScreen] cannot find <main> tag')
        return
      }

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
    } catch (e) {
      console.warn('[VideoScreen] parse error', e)
    }
  }, [status, html])

  const renderVideoContainer = () => {
    if (!videoData) return null
    switch (videoData.provider) {
      case 'dailymotion':
        return <WebView source={{ uri: `https://www.dailymotion.com/embed/video/${videoData.id}` }} style={styles.videoContainer} />
      case 'youtube':
        return <WebView source={{ uri: `https://www.youtube.com/embed/${videoData.id}` }} style={styles.videoContainer} />
      default:
        return null
    }
  }

  const isLoading = status === 'idle' || status === 'loading' || !article
  const fetchFailed = status === 'error'

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Hidden WebView — zero size, unmounts automatically after delivering HTML */}
      {webViewProps && <WebView {...webViewProps} />}

      {article?.isRestricted && <StatusBar backgroundColor={'rgba(255,196,0,1.0)'} barStyle="dark-content" />}
      {fetchFailed ? (
        <FetchError
          onRetry={() => {
            reset()
            if (videoUrl) fetch(videoUrl)
          }}
        />
      ) : isLoading ? (
        <ActivityIndicator style={{ flexGrow: 1, justifyContent: 'center' }} color={colors.primary} size={40} />
      ) : (
        <HeaderComponent article={article}>
          <Text variant="headlineSmall" style={styles.paddingH}>
            {article!.title}
          </Text>
          <Text variant="titleMedium" style={styles.paddingH}>
            {article!.description}
          </Text>
          <Text variant="bodyMedium" style={styles.paddingH}>
            {article!.authors}
          </Text>
          <Text variant="bodyMedium" style={styles.paddingH}>
            {article!.date}
          </Text>
          {renderVideoContainer()}
        </HeaderComponent>
      )}
      <View style={{ paddingBottom: 40 }} />
    </SafeAreaView>
  )
}
