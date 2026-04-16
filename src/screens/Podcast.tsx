import { ScrollViewWithHeaders } from '@codeherence/react-native-header'
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useLocalSearchParams } from 'expo-router'
import parse, { HTMLElement } from 'node-html-parser'
import { useContext, useEffect, useRef, useState } from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'
import { ActivityIndicator, IconButton, ProgressBar, Text, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'

import { ArticleItem } from '../components/ArticleItem'
import { FetchError } from '../components/FetchError'
import { HeaderComponent, LargeHeaderComponent } from '../components/Header'
import { SettingsContext } from '../context/SettingsContext'
import { useKeepScreenOn } from '../hooks/useKeepScreenOn'
import { useWebViewFetch } from '../hooks/useWebViewFetch'
import { ArticleHeader, ArticleHeaderParser, ContentType, InlineText } from '../types'

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function PodcastPlayer({ uri }: { uri: string }) {
  const { colors } = useTheme()
  const player = useAudioPlayer({ uri }, { updateInterval: 500 })
  const playerStatus = useAudioPlayerStatus(player)
  const hasLoaded = useRef(false)
  if (playerStatus.isLoaded) hasLoaded.current = true

  const seekBy = (deltaMs: number) => {
    const next = Math.max(0, Math.min(playerStatus.currentTime * 1000 + deltaMs, (playerStatus.duration ?? 0) * 1000))
    player.seekTo(next / 1000)
  }

  const duration = playerStatus.duration ?? 0
  const progress = duration > 0 ? playerStatus.currentTime / duration : 0

  if (!hasLoaded.current) {
    return <ActivityIndicator color={colors.primary} style={styles.playerLoader} />
  }

  return (
    <View style={[styles.player, { backgroundColor: colors.elevation.level2 }]}>
      <View style={styles.playerRow}>
        <IconButton icon="rewind-60" size={28} onPress={() => seekBy(-60_000)} />
        <IconButton icon="rewind-10" size={28} onPress={() => seekBy(-10_000)} />
        <IconButton
          icon={playerStatus.playing ? 'pause-circle' : 'play-circle'}
          size={52}
          iconColor={colors.primary}
          onPress={() => (playerStatus.playing ? player.pause() : player.play())}
        />
        <IconButton icon="fast-forward-10" size={28} onPress={() => seekBy(10_000)} />
        <IconButton icon="fast-forward-60" size={28} onPress={() => seekBy(60_000)} />
      </View>
      <ProgressBar progress={progress} color={colors.primary} style={styles.progress} />
      <View style={styles.timeRow}>
        <Text variant="labelSmall">{formatTime(playerStatus.currentTime * 1000)}</Text>
        <Text variant="labelSmall">{formatTime(duration * 1000)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  player: {
    marginHorizontal: 8,
    marginVertical: 12,
    padding: 12,
    borderRadius: 12
  },
  playerLoader: {
    marginVertical: 12
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
  const [paragraphes, setParagraphes] = useState<ContentType[]>([])
  const [podcastURI, setPodcastURI] = useState<string | null>(null)

  const { fetch, reset, html, status, webViewProps } = useWebViewFetch()

  const podcastUrl =
    category && yyyy && mm && dd && title ? `https://www.lemonde.fr/${category}/article/${yyyy}/${mm}/${dd}/${title}` : null

  useKeepScreenOn(settingsContext.keepScreenOn)

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true })
  }, [])

  useEffect(() => {
    if (!podcastUrl) return
    reset()
    fetch(podcastUrl)
  }, [podcastUrl])

  useEffect(() => {
    if (status !== 'done' || !html) return
    try {
      const doc = parse(html)
      const metas = Array.from(doc.querySelectorAll('meta')).filter((m): m is HTMLElement => m instanceof HTMLElement)

      setArticle(new ArticleHeaderParser().parse(metas))

      const audioUrl = metas.find((m) => m.getAttribute('property') === 'og:audio')?.getAttribute('content')
      if (audioUrl) setPodcastURI(audioUrl)

      const contentDiv = doc.querySelector('.content_description')
      if (contentDiv) {
        const items: ContentType[] = []
        for (const p of contentDiv.querySelectorAll('p')) {
          const data: InlineText[] = []
          for (const child of p.childNodes) {
            const text = child.text.trim()
            if (!text) continue
            const tag = (child as HTMLElement).tagName?.toLowerCase()
            if (tag === 'em') data.push({ type: 'em', text })
            else if (tag === 'strong') data.push({ type: 'strong', text })
            else data.push({ type: 'text', text })
          }
          if (data.length > 0) items.push({ type: 'paragraph', data })
        }
        setParagraphes(items)
      }
    } catch (e) {
      console.warn('[PodcastScreen] parse error', e)
    }
  }, [status, html])

  const isLoading = status === 'idle' || status === 'loading' || !article
  const fetchFailed = status === 'error'

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor={'rgba(0,0,0,0.33)'} translucent barStyle="light-content" />

      {webViewProps && <WebView {...webViewProps} />}

      {fetchFailed ? (
        <FetchError
          onRetry={() => {
            reset()
            if (podcastUrl) fetch(podcastUrl)
          }}
        />
      ) : isLoading ? (
        <ActivityIndicator
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
          color={colors.primary}
          size={40}
        />
      ) : (
        <ScrollViewWithHeaders
          HeaderComponent={(props: any) => <HeaderComponent {...props} article={article} />}
          LargeHeaderComponent={(props: any) => <LargeHeaderComponent {...props} article={article} />}>
          <Text variant="titleMedium" style={{ paddingHorizontal: 8, paddingTop: 8 }}>
            {article!.title}
          </Text>

          {paragraphes.map((item, index) => (
            <ArticleItem key={index} item={item} />
          ))}

          {podcastURI && <PodcastPlayer uri={podcastURI} />}
        </ScrollViewWithHeaders>
      )}
      <View style={{ paddingBottom: 40 }} />
    </SafeAreaView>
  )
}
