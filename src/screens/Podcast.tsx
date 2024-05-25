import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Text, useTheme } from 'react-native-paper'
import { useRoute } from '@react-navigation/core'
import { RouteProp } from '@react-navigation/native'
import parse, { HTMLElement } from 'node-html-parser'
import { ScrollViewWithHeaders } from '@codeherence/react-native-header'
import VideoPlayer from 'react-native-media-console'
import { decode } from 'html-entities'

import { SettingsContext } from '../context/SettingsContext'
import Api from '../api'
import DynamicNavbar from '../DynamicNavbar'
import { ArticleHeader, ArticleHeaderParser, MainStackParamList, ParsedLink } from '../types'
import { HeaderComponent } from '../components/Header'
import FetchError from '../components/FetchError'

type PodcastScreenRouteProp = RouteProp<MainStackParamList, 'Podcast'>

interface ImageObject {
  '@type': string
  '@id': string
  url: string
  contentUrl: string
  caption: string
}

interface Publisher {
  '@id': string
}

interface PrimaryImageOfPage {
  '@id': string
}

interface BreadcrumbListItem {
  '@type': string
  position: number
  name: string
  item: string
}

interface BreadcrumbList {
  '@type': string
  '@id': string
  itemListElement: BreadcrumbListItem[]
}

interface Organization {
  '@type': string
  '@id': string
  name: string
  url: string
  sameAs: string[]
  logo: ImageObject
  image: ImageObject
}

interface WebSite {
  '@type': string
  '@id': string
  url: string
  name: string
  description: string
  inLanguage: string
  publisher: Publisher
}

interface WebPage {
  '@type': string
  '@id': string
  url: string
  name: string
  description: string
  inLanguage: string
  publisher: Publisher
  isPartOf: {
    '@id': string
  }
  primaryImageOfPage: PrimaryImageOfPage
  breadcrumb: {
    '@id': string
  }
}

interface PodcastEpisode {
  url: string
  name: string
  datePublished: string
  description: string
  associatedMedia: {
    '@type': string
    contentUrl: string
  }
  partOfSeries: {
    '@type': string
    name: string
    url: string
  }
}

interface PodcastData {
  '@context': string
  '@graph': (Organization | WebSite | ImageObject | WebPage | BreadcrumbList | PodcastEpisode)[]
}

/**
 * @author Matthieu BACHELIER
 * @since 2024-05
 * @version 1.0
 */
export default function PodcastScreen() {
  const route = useRoute<PodcastScreenRouteProp>()
  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()

  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState<boolean>(false)
  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [paragraphes, setParagraphes] = useState<string[]>([])
  const [podcastURI, setPodcastURI] = useState<string | null>(null)

  const styles = StyleSheet.create({
    containerStyle: {
      width: '100%',
      height: 128
    }
  })

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (settingsContext.keepScreenOn) {
      DynamicNavbar.setKeepScreenOn(true)
      return () => {
        DynamicNavbar.setKeepScreenOn(false)
      }
    }
  }, [settingsContext.keepScreenOn])

  const init = async () => {
    if (!route.params) {
      console.warn('no params!')
      return
    }
    setFetchFailed(false)
    try {
      const l: ParsedLink = route.params as ParsedLink
      const response = await Api.get(`podcasts/article/${l.yyyy}/${l.mm}/${l.dd}/${l.title}`)
      const doc = parse(await response.text())

      // Category and other infos in the header
      const metas = Array.from(doc.querySelectorAll('meta')).filter((meta): meta is HTMLElement => meta instanceof HTMLElement)
      const parser = new ArticleHeaderParser()
      const a = parser.parse(metas)

      if (metas) {
        const metaOgAudio = metas.find((meta: HTMLElement) => meta.getAttribute('property') === 'og:audio')
        if (metaOgAudio) {
          let content = metaOgAudio.getAttribute('content')
          if (content) {
            const scripts: HTMLElement[] = doc.getElementsByTagName('script')
            for (const script of scripts) {
              if (script.getAttribute('type') === 'application/ld+json') {
                const jsonString: PodcastData = JSON.parse(script.innerHTML)
                const graph = jsonString['@graph']
                const webPage: WebPage | undefined = graph.find((item: any) => item['@type'] === 'WebPage') as WebPage | undefined
                if (webPage?.description) {
                  const paragraphs = decode(webPage.description).split('  ')
                  setParagraphes(paragraphs)
                }
                break
              }
            }
            setPodcastURI(content)
          }
        }
      }
      setArticle(a)
      setLoading(false)
    } catch (error) {
      setFetchFailed(true)
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor={'rgba(0,0,0,0.33)'} translucent barStyle="light-content" />
      {fetchFailed ? (
        <FetchError onRetry={init} />
      ) : loading || !article || !podcastURI ? (
        <ActivityIndicator style={{ flexGrow: 1, justifyContent: 'center' }} color={colors.primary} size={40} />
      ) : (
        <ScrollViewWithHeaders HeaderComponent={(props) => <HeaderComponent {...props} article={article} />}>
          <Text variant="titleMedium">{article.title}</Text>
          <VideoPlayer
            source={{ uri: podcastURI }}
            containerStyle={styles.containerStyle}
            alwaysShowControls
            disableBack
            disableFullscreen
            disableVolume
            showDuration
            showOnStart
            seekColor={colors.primary}
          />
          {paragraphes.map((p: string, index: number) => (
            <Text key={`p-${index}`} variant="bodyMedium" style={{ paddingBottom: 4 }}>
              {p}
            </Text>
          ))}
        </ScrollViewWithHeaders>
      )}
      <View style={{ paddingBottom: 40 }} />
    </SafeAreaView>
  )
}
