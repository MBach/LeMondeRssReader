import { useLocalSearchParams } from 'expo-router'
import parse from 'node-html-parser'
import { useContext, useEffect, useState } from 'react'
import { StatusBar, StyleSheet, useWindowDimensions } from 'react-native'
import { ActivityIndicator, Text, useTheme } from 'react-native-paper'
import WebView from 'react-native-webview'

import { ScrollViewWithHeaders } from '@codeherence/react-native-header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArticleItem } from '../components/ArticleItem'
import { FetchError } from '../components/FetchError'
import { HeaderComponent } from '../components/Header'
import { SettingsContext } from '../context/SettingsContext'
import { useKeepScreenOn } from '../hooks/useKeepScreenOn'
import { useWebViewFetch } from '../hooks/useWebViewFetch'
import { ArticleHeader, ContentType } from '../types'
import { parseArticleHtml } from '../utils/articleParser'

/**
 * @author Matthieu BACHELIER
 * @since 2020-04
 * @version 3.0
 */
export default function VideoScreen() {
  type VideoData = {
    id: string
    provider: string
    isVertical: boolean
  }

  const { category, slug } = useLocalSearchParams<{ category: string; slug: string[] }>()
  const [yyyy, mm, dd, title] = Array.isArray(slug) ? slug : []

  const window = useWindowDimensions()
  const { colors } = useTheme()

  const settingsContext = useContext(SettingsContext)

  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [paragraphes, setParagraphes] = useState<ContentType[]>([])

  const { fetch, reset, html, status, webViewProps } = useWebViewFetch()

  useKeepScreenOn(settingsContext.keepScreenOn)

  const videoUrl = category && yyyy && mm && dd && title ? `https://www.lemonde.fr/${category}/article/${yyyy}/${mm}/${dd}/${title}` : null

  const portraitVideoHeight = window.height * 0.8
  const portraitVideoWidth = portraitVideoHeight * (9 / 16)

  const styles = StyleSheet.create({
    videoLandscape: {
      width: window.width,
      height: (window.width * 9) / 16
    },
    videoPortrait: {
      alignSelf: 'center',
      width: portraitVideoWidth,
      height: portraitVideoHeight
    }
  })

  useEffect(() => {
    if (!videoUrl) {
      console.log('[VideoScreen] params not ready yet:', { category, slug })
      return
    }
    reset()
    fetch(videoUrl)
  }, [videoUrl])

  useEffect(() => {
    if (status !== 'done' || !html) return
    try {
      const doc = parse(html)
      const main = doc.querySelector('main')

      const specialContainer = main?.querySelector('.article__special-container--video')
      const videoContainer = specialContainer?.querySelector('div[data-provider]')
      if (videoContainer) {
        const provider = videoContainer.getAttribute('data-provider')
        const id = videoContainer.getAttribute('data-id')
        const isVertical = specialContainer?.classNames.includes('article__special-container--vertical') ?? false
        if (id && provider) setVideoData({ id: id.trim(), provider, isVertical })
      }

      const { article: a, paragraphes: p } = parseArticleHtml(html, window.width, settingsContext.hasReadAlso)
      setArticle(a)
      setParagraphes(p)
    } catch (e) {
      console.warn('[VideoScreen] parse error', e)
    }
  }, [status, html])

  const renderVideoPlayer = () => {
    if (!videoData) return null
    const videoStyle = videoData.isVertical ? styles.videoPortrait : styles.videoLandscape
    switch (videoData.provider) {
      case 'dailymotion':
        return <WebView source={{ uri: `https://www.dailymotion.com/embed/video/${videoData.id}` }} style={videoStyle} />
      case 'youtube':
        return <WebView source={{ uri: `https://www.youtube.com/embed/${videoData.id}` }} style={videoStyle} />
      default:
        return null
    }
  }

  const isLoading = status === 'idle' || status === 'loading' || !article
  const fetchFailed = status === 'error'

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
        <ActivityIndicator
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
          color={colors.primary}
          size={40}
        />
      ) : (
        <ScrollViewWithHeaders HeaderComponent={(props: any) => <HeaderComponent {...props} article={article} />}>
          <Text variant="titleMedium" style={{ paddingHorizontal: 8, paddingTop: 8 }}>
            {article!.title}
          </Text>
          {renderVideoPlayer()}
          {paragraphes.map((item, index) => (
            <ArticleItem key={index} item={item} />
          ))}
        </ScrollViewWithHeaders>
      )}
    </SafeAreaView>
  )
}
