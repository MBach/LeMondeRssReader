import React, { useContext, useEffect, useState } from 'react'
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Surface, Text, useTheme } from 'react-native-paper'
import { useRoute } from '@react-navigation/core'
import { RouteProp } from '@react-navigation/native'
import parse, { HTMLElement } from 'node-html-parser'
import VideoPlayer from 'react-native-media-console'
import { decode } from 'html-entities'

import Header from '../components/Header'
import { SettingsContext } from '../context/SettingsContext'
import { HomeStackParamList } from '../navigation/AppContainer'
import DynamicNavbar from '../DynamicNavbar'
import { ArticleHeader, ArticleHeaderParser, ParsedLink } from '../types'
import Api from '../api'
import CustomHeader from '../components/Header'

const styles = StyleSheet.create({
  containerStyle: {
    width: '100%',
    height: 128
  }
})

type PodcastScreenRouteProp = RouteProp<HomeStackParamList, 'Podcast'>

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
  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [podcastURI, setPodcastURI] = useState<string | null>(null)
  const [paragraphes, setParagraphes] = useState<string[]>([])

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
    let l: ParsedLink = route.params as ParsedLink
    const response = await Api.get(`https://www.lemonde.fr/podcasts/article/${l.yyyy}/${l.mm}/${l.dd}/${l.title}`)
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
              const jsonString = JSON.parse(script.innerHTML)
              const graph = jsonString['@graph']
              const webPage = graph.find((item: any) => item['@type'] === 'WebPage')
              if (webPage && webPage.description) {
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
  }

  return (
    <Surface elevation={0} style={{ flex: 1 }}>
      <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
        <CustomHeader article={article} loading={loading} />
        {loading ? (
          <ActivityIndicator style={{ minHeight: 200, justifyContent: 'center', alignContent: 'center' }} />
        ) : (
          <>
            {article && podcastURI && (
              <>
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
              </>
            )}
          </>
        )}
        <View style={{ paddingBottom: 40 }} />
      </ScrollView>
    </Surface>
  )
}
