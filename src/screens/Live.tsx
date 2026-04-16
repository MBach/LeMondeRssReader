import { FlatListWithHeaders } from '@codeherence/react-native-header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import parse, { HTMLElement, Node } from 'node-html-parser'
import { useContext, useEffect, useState } from 'react'
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native'
import { ActivityIndicator, Banner, Card, Chip, List, Surface, Text, useTheme } from 'react-native-paper'
import WebView from 'react-native-webview'
import { useKeepScreenOn } from '../hooks/useKeepScreenOn'
import { useWebViewAjaxPoll } from '../hooks/useWebViewAjaxPoll'

import { SafeAreaView } from 'react-native-safe-area-context'
import { IconPremium } from '../../assets'
import CustomStatusBar from '../components/CustomStatusBar'
import { FetchError } from '../components/FetchError'
import { HeaderComponent, LargeHeaderComponent } from '../components/Header'
import { SettingsContext } from '../context/SettingsContext'
import { useWebViewFetch } from '../hooks/useWebViewFetch'
import { i18n } from '../locales/i18n'
import {
  ArticleHeader,
  ArticleHeaderParser,
  ArticleType,
  LiveContentType,
  parseAndGuessURL,
  SectionContent,
  SeeAlsoButtonContent
} from '../types'

interface LiveAjaxResponse {
  created: any[]
  updated: any[]
  deleted: any[]
  article: any | null
  isOpen: boolean
  isLocked: boolean
  lastPost: {
    date: string
    timezone_type: number
    timezone: string
  } | null
  lastArticleModification: {
    date: string
    timezone_type: number
    timezone: string
  } | null
}

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 3.0
 */
export default function LiveScreen() {
  const allParams = useLocalSearchParams()
  const { category, slug } = allParams as { category?: string; slug?: string | string[] }
  const slugArr = Array.isArray(slug) ? slug : slug ? [slug] : []
  const [yyyy, mm, dd, title] = slugArr

  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()
  const window = useWindowDimensions()
  const router = useRouter()
  const { fetch, reset, html, status, webViewProps } = useWebViewFetch()

  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [sections, setSections] = useState<SectionContent[]>([])
  const [lastPost, setLastPost] = useState<string | null>(null)
  const [lastArticleModification, setLastArticleModification] = useState<string | null>(null)

  const articleUrl = category && yyyy && mm && dd && title ? `https://www.lemonde.fr/${category}/live/${yyyy}/${mm}/${dd}/${title}` : null

  const { data, webViewProps: pollWebViewProps } = useWebViewAjaxPoll<LiveAjaxResponse>(
    articleUrl,
    () => {
      if (!article?.id) return null
      const parts: string[] = []
      if (lastPost) parts.push(`lastPost=${encodeURIComponent(lastPost)}`)
      if (lastArticleModification) parts.push(`lastArticleModification=${encodeURIComponent(lastArticleModification)}`)
      const qs = parts.length > 0 ? `?${parts.join('&')}` : ''
      return `https://www.lemonde.fr/ajax/live/article/${article.id}${qs}`
    },
    5000,
    !!article?.id
  )

  const styles = StyleSheet.create({
    imageHeader: {
      width: window.width,
      height: 250,
      resizeMode: 'cover'
    },
    li: {
      marginLeft: 8
    },
    sm: {
      marginBottom: 8
    },
    quote: {
      marginHorizontal: 8,
      marginBottom: 8,
      padding: 8
    },
    iframeContainer: {
      width: window.width,
      height: (window.width * 9) / 16
    },
    videoContainer: {
      marginTop: 20,
      width: window.width,
      height: (window.width * 9) / 16
    }
  })

  // Kick off WebView fetch when params change
  useEffect(() => {
    if (!category || !yyyy || !mm || !dd || !title) {
      console.warn('[LiveScreen] missing params, skipping fetch')
      return
    }
    reset()
    fetch(`https://www.lemonde.fr/${category}/live/${yyyy}/${mm}/${dd}/${title}`)
  }, [slugArr.join('/')])

  // Parse HTML once WebView delivers it
  useEffect(() => {
    if (status !== 'done' || !html) return
    try {
      parseHtml(html)
    } catch (e) {
      console.warn('[LiveScreen] parse error', e)
    }
  }, [status, html])

  useKeepScreenOn(settingsContext.keepScreenOn)

  useEffect(() => {
    if (!data) return
    const newLastPost = data.lastPost?.date?.replace(/\.\d+$/, '') || null
    const newLastArticleModification = data.lastArticleModification?.date?.replace(/\.\d+$/, '') || null
    if (newLastPost) setLastPost(newLastPost)
    if (newLastArticleModification) setLastArticleModification(newLastArticleModification)
  }, [data])

  const parseHtml = async (rawHtml: string) => {
    const doc = parse(rawHtml)
    const metas = Array.from(doc.querySelectorAll('meta')).filter((meta): meta is HTMLElement => meta instanceof HTMLElement)

    const parser = new ArticleHeaderParser()
    const a: ArticleHeader = parser.parse(metas)

    const uniqueSectionKeys = new Set<string>()
    const s: SectionContent[] = []

    const addUniqueSection = (section: SectionContent, key: string) => {
      if (!uniqueSectionKeys.has(key)) {
        uniqueSectionKeys.add(key)
        s.push(section)
      }
    }

    // Process hero section
    const hero: HTMLElement | null = doc.querySelector('section.hero__live-content')
    if (hero !== null) {
      const section: SectionContent = { id: '', hero: false, hasBorder: false, contents: [] }

      const meta: HTMLElement | null = doc.querySelector('div.hero__live-meta')
      if (meta) {
        const label = meta.querySelector('span.flag-live-cartridge__label')
        const metaDate = meta.querySelector('span.meta__date')
        if (label && metaDate) {
          section.contents.push({ type: 'chip', data: label.textContent, lastUpdated: metaDate.textContent })
        }
      }

      const titleEl: HTMLElement | null = hero.querySelector('section.title')
      if (titleEl) {
        const h1: HTMLElement | null = titleEl.querySelector('h1')
        if (h1 && a.title.trim() !== h1.textContent.trim()) {
          section.contents.push({ type: 'h1', data: h1.textContent })
        }
        const p: HTMLElement | null = titleEl.querySelector('p')
        if (p) {
          section.contents.push({ type: 'h2', data: p.textContent })
        }
      }

      if (section.contents.length > 0) {
        addUniqueSection(section, 'hero')
      }
    }

    // Process post sections
    const posts: HTMLElement | null = doc.querySelector('#post-container')
    if (posts !== null) {
      const postSections = Array.from(posts.children).filter((node) => node.rawTagName.toLowerCase() === 'section')
      for (const node of postSections) {
        const dataPostId = node.getAttribute('data-post-id')
        if (!dataPostId) continue
        const section = await extractSection(node)
        if (section && section.contents.length > 0) {
          addUniqueSection(section, dataPostId)
        }
      }
    }

    setSections(s)
    setArticle(a)
  }

  /**
   * Transforms a Node into a JSON-like structure in order to be displayed.
   */
  const extractSection = async (node: Node): Promise<SectionContent | undefined> => {
    const section: SectionContent = { id: '', hero: false, hasBorder: false, contents: [] }
    const htmlElement: HTMLElement = node as HTMLElement

    const border = htmlElement.querySelector('.flag-live__border, .flag-live__border__label')
    if (border && border.hasAttribute('style')) {
      section.hasBorder = true
    }

    const header = htmlElement.querySelector('.header-content__live > .info-content')
    if (header) {
      section.header = header.textContent.trim()
    }

    const postId = htmlElement.getAttribute('id')
    if (postId) {
      section.id = postId
    }

    let contents = htmlElement.querySelectorAll('.content--live > *')
    if (contents.length === 0) {
      contents = htmlElement.querySelectorAll('.meta__social--new-live-post > *')
    }

    for (const content of contents) {
      switch (content.rawTagName) {
        case 'h2':
          section.contents.push({ type: content.rawTagName, data: content.textContent })
          break
        case 'div':
          if (content.classNames === 'post__live-container--answer') {
            section.contents.push({ type: content.rawTagName, data: content.textContent })
          } else if (content.classNames === 'post__live-container--comment-content') {
            const blockquote = content.querySelector('blockquote.post__live-container--comment-blockquote')
            const author = content.querySelector('span.post__live-container--comment-author')
            if (blockquote && author) {
              section.contents.push({ type: 'quote', data: blockquote.textContent, author: author.textContent })
            }
          } else if (
            content.classNames.includes('post__live-container--link-content') ||
            content.classNames.includes('read-also-live__container')
          ) {
            const readAlso = content.querySelector('a.js-live-read-also')
            if (settingsContext.hasReadAlso && readAlso) {
              section.contents.push({
                type: 'seeAlsoButton',
                data: readAlso.getAttribute('title') || readAlso.textContent,
                url: readAlso.attrs['href'],
                isRestricted: readAlso.getAttribute('data-premium') === '1'
              })
            }
          } else if (content.classNames.startsWith('article__video-container')) {
            const videoContainer = content.querySelector('.js_player')
            if (videoContainer) {
              const provider = videoContainer.getAttribute('data-provider')
              const id = videoContainer.getAttribute('data-id')
              if (provider && id) {
                section.contents.push({ type: 'webview-video', provider, data: id })
              }
            }
          } else {
            section.contents.push({ type: content.rawTagName, data: content.textContent })
          }
          break
        case 'figure': {
          const img = content.querySelector('img')
          const imgSrc = img?.getAttribute('data-src')
          if (img && imgSrc) {
            section.contents.push({ type: 'img', uri: imgSrc })
          }
          const figcaption = content.querySelector('figcaption')
          if (figcaption) {
            section.contents.push({ type: 'caption', data: figcaption.textContent })
          }
          break
        }
        case 'ul':
          for (const li of content.childNodes) {
            section.contents.push({ type: 'list', data: li.textContent })
          }
          break
        case 'iframe': {
          const dataSrc = content.getAttribute('data-src')
          if (dataSrc) {
            section.contents.push({ type: 'iframe', data: dataSrc })
          }
          break
        }
        default:
          break
      }
    }

    if (section.contents.length > 0) {
      return section
    }
  }

  const renderContent = (content: LiveContentType, index: number) => {
    switch (content.type) {
      case 'chip':
        return (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Chip icon="information" compact style={{ marginEnd: 12 }}>
              {content.data}
            </Chip>
            <Text style={{ flex: 1 }}>{content.lastUpdated}</Text>
          </View>
        )
      case 'h1':
        return (
          <Text key={index} variant="titleLarge" style={styles.sm}>
            {content.data}
          </Text>
        )
      case 'h2':
        return (
          <Text key={index} variant="titleMedium" style={styles.sm}>
            {content.data}
          </Text>
        )
      case 'div':
        return (
          <Text key={index} style={styles.sm}>
            {content.data}
          </Text>
        )
      case 'quote':
        return (
          <Surface key={index} style={styles.quote}>
            <Text>{content.data}</Text>
            <Text variant="labelSmall" style={{ textAlign: 'right' }}>
              {content.author}
            </Text>
          </Surface>
        )
      case 'caption':
        return (
          <Text key={index} variant="labelSmall" style={styles.sm}>
            {content.data}
          </Text>
        )
      case 'img':
        return <Image key={index} source={{ uri: content.uri }} style={styles.imageHeader} />
      case 'list':
        return (
          <Text key={index} variant="titleSmall" style={styles.li}>
            {content.data}
          </Text>
        )
      case 'seeAlsoButton': {
        const see = content as SeeAlsoButtonContent
        return (
          <Card
            key={index}
            mode="elevated"
            style={{ marginStart: 24, marginEnd: 8, marginVertical: 8 }}
            onPress={() => {
              const parsed = parseAndGuessURL(content.url)
              if (parsed) {
                const { type, category: c, yyyy: y, mm: m, dd: d, title: t } = parsed
                switch (type) {
                  case ArticleType.ARTICLE:
                    router.push(`/(tabs)/(home)/${c}/article/${y}/${m}/${d}/${t}`)
                    break
                  case ArticleType.LIVE:
                    router.push(`/(tabs)/(home)/${c}/live/${y}/${m}/${d}/${t}`)
                    break
                  case ArticleType.VIDEO:
                    router.push(`/(tabs)/(home)/${c}/video/${y}/${m}/${d}/${t}`)
                    break
                  case ArticleType.PODCAST:
                    router.push(`/(tabs)/(home)/${c}/podcast/${y}/${m}/${d}/${t}`)
                    break
                }
              }
            }}>
            <Card.Content style={{ flexDirection: 'row', marginEnd: 8 }}>
              {see.isRestricted && (
                <Image
                  source={IconPremium}
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: colors.primaryContainer,
                    tintColor: colors.onPrimaryContainer,
                    marginRight: 8
                  }}
                />
              )}
              <Text variant="bodyMedium" numberOfLines={3}>
                {see.data}
              </Text>
            </Card.Content>
          </Card>
        )
      }
      case 'webview-video':
        switch (content.provider) {
          case 'dailymotion':
            return (
              <WebView
                key={index}
                source={{ uri: `https://www.dailymotion.com/embed/video/${content.data}` }}
                style={styles.videoContainer}
              />
            )
          case 'youtube':
            return <WebView key={index} source={{ uri: `https://www.youtube.com/embed/${content.data}` }} style={styles.videoContainer} />
        }
        return null
      default:
        return null
    }
  }

  const renderSection = ({ item, index }: { item: SectionContent; index: number }) => {
    const sectionStyle = item.hasBorder
      ? { borderLeftColor: '#be1514', borderLeftWidth: 2, paddingHorizontal: 4 }
      : { paddingHorizontal: 4 }

    return (
      <List.Section key={item.id ?? `section-${index}`} style={sectionStyle}>
        {item.header && <List.Subheader style={{ color: item.hasBorder ? '#be1514' : colors.onSurface }}>{item.header}</List.Subheader>}
        {item.contents.map(renderContent)}
      </List.Section>
    )
  }

  const isLoading = status === 'idle' || status === 'loading' || !article
  const fetchFailed = status === 'error'

  return (
    <>
    <SafeAreaView style={{ flex: 1, marginBottom: -48 }}>
      {fetchFailed ? (
        <FetchError
          onRetry={() => {
            reset()
            fetch(`https://www.lemonde.fr/${category}/live/${yyyy}/${mm}/${dd}/${title}`)
          }}
        />
      ) : isLoading ? (
        <ActivityIndicator
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
          color={colors.primary}
          size={40}
        />
      ) : (
        <>
          <Banner
            icon="update"
            visible={Array.isArray(data?.created) && data.created.length > 0}
            actions={[{ label: i18n.t('live.view'), onPress: () => {} }]}>
            {i18n.t('live.newComments')}
          </Banner>
          <CustomStatusBar translucent />
          <FlatListWithHeaders
            disableAutoFixScroll
            headerFadeInThreshold={0.8}
            disableLargeHeaderFadeAnim={false}
            data={sections}
            extraData={sections}
            renderItem={renderSection}
            keyExtractor={(_: any, index: number) => index.toString()}
            HeaderComponent={(props: any) => <HeaderComponent {...props} article={article} />}
            LargeHeaderComponent={(props: any) => <LargeHeaderComponent {...props} article={article} />}
          />
        </>
      )}
    </SafeAreaView>
    <View style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      {webViewProps && <WebView {...webViewProps} />}
      {pollWebViewProps && <WebView {...pollWebViewProps} />}
    </View>
  </>
  )
}
