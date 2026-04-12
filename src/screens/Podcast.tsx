import { ScrollViewWithHeaders } from '@codeherence/react-native-header'
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useLocalSearchParams } from 'expo-router'
import { decode } from 'html-entities'
import parse, { HTMLElement } from 'node-html-parser'
import { useContext, useEffect, useState } from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'
import { ActivityIndicator, IconButton, ProgressBar, Text, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'

import { FetchError } from '../components/FetchError'
import { HeaderComponent } from '../components/Header'
import { SettingsContext } from '../context/SettingsContext'
import { useWebViewFetch } from '../hooks/useWebViewFetch'
import { ArticleHeader, ArticleHeaderParser } from '../types'

interface WebPage {
  '@type': string
  description: string
  [key: string]: any
}

interface PodcastData {
  '@context': string
  '@graph': any[]
}

/**
 * @author Matthieu BACHELIER
 * @since 2024-05
 * @version 2.0
 */
export default function PodcastScreen() {
  const { category, slug } = useLocalSearchParams<{ category: string; slug: string[] }>()
  const [yyyy, mm, dd, title] = Array.isArray(slug) ? slug : []
  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()

  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [paragraphes, setParagraphes] = useState<string[]>([])
  const [podcastURI, setPodcastURI] = useState<string | null>(null)

  const { fetch, reset, html, status, webViewProps } = useWebViewFetch()

  // expo-audio: player is re-created whenever podcastURI changes
  const player = useAudioPlayer(podcastURI ? { uri: podcastURI } : null, { updateInterval: 500 })
  const playerStatus = useAudioPlayerStatus(player)

  const podcastUrl =
    category && yyyy && mm && dd && title ? `https://www.lemonde.fr/${category}/podcast/${yyyy}/${mm}/${dd}/${title}` : null

  // Configure audio session once
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true })
  }, [])

  // Kick off WebView fetch when params change
  useEffect(() => {
    if (!podcastUrl) return
    reset()
    fetch(podcastUrl)
  }, [podcastUrl])

  // Parse HTML once received from WebView
  useEffect(() => {
    if (status !== 'done' || !html) return
    try {
      const doc = parse(html)
      const metas = Array.from(doc.querySelectorAll('meta')).filter((m): m is HTMLElement => m instanceof HTMLElement)
      const a = new ArticleHeaderParser().parse(metas)
      setArticle(a)

      const metaOgAudio = metas.find((m) => m.getAttribute('property') === 'og:audio')
      const audioUrl = metaOgAudio?.getAttribute('content')
      if (audioUrl) {
        for (const script of doc.getElementsByTagName('script')) {
          if (script.getAttribute('type') === 'application/ld+json') {
            try {
              const jsonData: PodcastData = JSON.parse(script.innerHTML)
              const webPage = jsonData['@graph']?.find((item: any) => item['@type'] === 'WebPage') as WebPage | undefined
              if (webPage?.description) {
                setParagraphes(decode(webPage.description).split('  '))
              }
            } catch {}
            break
          }
        }
        setPodcastURI(audioUrl)
      }
    } catch (e) {
      console.warn('[PodcastScreen] parse error', e)
    }
  }, [status, html])

  // Keep screen on
  useEffect(() => {
    if (settingsContext.keepScreenOn) {
      activateKeepAwakeAsync()
    } else {
      deactivateKeepAwake()
    }
  }, [settingsContext.keepScreenOn])

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const seekBy = (deltaMs: number) => {
    const next = Math.max(0, Math.min(playerStatus.currentTime * 1000 + deltaMs, (playerStatus.duration ?? 0) * 1000))
    player.seekTo(next / 1000)
  }

  const styles = StyleSheet.create({
    player: {
      marginHorizontal: 8,
      marginVertical: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.elevation.level2
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4
    },
    progress: {
      marginTop: 8,
      borderRadius: 4
    }
  })

  const isLoading = status === 'idle' || status === 'loading' || !article || !podcastURI
  const fetchFailed = status === 'error'
  const duration = playerStatus.duration ?? 0
  const progress = duration > 0 ? playerStatus.currentTime / duration : 0

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor={'rgba(0,0,0,0.33)'} translucent barStyle="light-content" />

      {/* Hidden WebView for fetching HTML */}
      {webViewProps && <WebView {...webViewProps} />}

      {fetchFailed ? (
        <FetchError
          onRetry={() => {
            reset()
            if (podcastUrl) fetch(podcastUrl)
          }}
        />
      ) : isLoading ? (
        <ActivityIndicator style={{ flexGrow: 1, justifyContent: 'center' }} color={colors.primary} size={40} />
      ) : (
        <ScrollViewWithHeaders HeaderComponent={(props: any) => <HeaderComponent {...props} article={article} />}>
          <Text variant="titleMedium" style={{ paddingHorizontal: 8, paddingTop: 8 }}>
            {article!.title}
          </Text>

          {/* Audio player */}
          <View style={styles.player}>
            {!playerStatus.isLoaded ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <View style={styles.playerRow}>
                  <IconButton icon="rewind-10" size={28} onPress={() => seekBy(-10_000)} />
                  <IconButton
                    icon={playerStatus.playing ? 'pause-circle' : 'play-circle'}
                    size={52}
                    iconColor={colors.primary}
                    onPress={() => (playerStatus.playing ? player.pause() : player.play())}
                  />
                  <IconButton icon="fast-forward-10" size={28} onPress={() => seekBy(10_000)} />
                </View>
                <ProgressBar progress={progress} color={colors.primary} style={styles.progress} />
                <View style={styles.timeRow}>
                  <Text variant="labelSmall">{formatTime(playerStatus.currentTime * 1000)}</Text>
                  <Text variant="labelSmall">{formatTime(duration * 1000)}</Text>
                </View>
              </>
            )}
          </View>

          {paragraphes.map((p, index) => (
            <Text key={`p-${index}`} variant="bodyMedium" style={{ paddingHorizontal: 8, paddingBottom: 4 }}>
              {p}
            </Text>
          ))}
        </ScrollViewWithHeaders>
      )}
      <View style={{ paddingBottom: 40 }} />
    </SafeAreaView>
  )
}
