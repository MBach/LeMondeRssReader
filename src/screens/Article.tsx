import { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, Image, Linking, StyleSheet, View, ActivityIndicator, SafeAreaView } from 'react-native'
import { useTheme, Button, Card, Text } from 'react-native-paper'
import { useRoute } from '@react-navigation/core'
import { useNavigation } from '@react-navigation/native'
import parse, { HTMLElement, Node } from 'node-html-parser'
import { FlatListWithHeaders } from '@codeherence/react-native-header'
import WebView from 'react-native-webview'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { i18n } from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'
import {
  ArticleHeader,
  ArticleHeaderParser,
  ContentType,
  ImgContent,
  InlineText,
  MainStackNavigation,
  ParsedLink,
  SeeAlsoButtonContent,
  parseAndGuessURL
} from '../types'
import DynamicNavbar from '../DynamicNavbar'
import { Api } from '../api'
import { HeaderComponent, LargeHeaderComponent } from '../components/Header'
import { IconPremium } from '../assets'
import { FetchError } from '../components/FetchError'
import { CustomStatusBar } from '../components/CustomStatusBar'

const regex = /https:\/\/img\.lemde.fr\/\d+\/\d+\/\d+\/\d+\/\d+\/(\d+)\/(\d+)\/.*/

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export function ArticleScreen() {
  const route = useRoute()
  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()
  const window = useWindowDimensions()
  const navigation = useNavigation<MainStackNavigation>()

  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState<boolean>(false)
  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [paragraphes, setParagraphes] = useState<ContentType[]>([])

  const styles = StyleSheet.create({
    subtitle: {
      paddingHorizontal: 8,
      marginTop: 8
    },
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
    },
    activityIndicator: {
      flexGrow: 1,
      justifyContent: 'center'
    },
    card: {
      margin: 8,
      backgroundColor: colors.elevation.level2
    },
    footerPadding: {
      paddingBottom: 40
    },
    videoContainer: {
      marginTop: 20,
      width: window.width,
      height: (window.width * 9) / 16
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

  /**
   *
   * @param figure
   * @returns
   */
  const extractFigureContent = (figure: HTMLElement): ImgContent | null => {
    const img = figure.querySelector('img')
    if (img) {
      let imgSrc = img.getAttribute('src')
      if (!imgSrc) {
        imgSrc = img.getAttribute('data-src')
      }
      let caption: string | null = null
      if (imgSrc) {
        const figcaption = figure.querySelector('figcaption')
        if (figcaption && figcaption.text) {
          caption = figcaption.text
        }
      } else {
        return null
      }

      const b: RegExpExecArray | null = regex.exec(imgSrc)
      let ratio: number | undefined
      if (b && b.length === 3) {
        const num1 = parseFloat(b[1])
        const num2 = parseFloat(b[2])
        if (!isNaN(num1) && !isNaN(num2)) {
          ratio = num1 / num2
        }
      }
      return { type: 'img', uri: imgSrc, ratio, caption }
    }
    return null
  }

  /**
   *
   * @param node
   * @returns
   */
  const extractParagraphContent = (node: HTMLElement): InlineText[] => {
    const content: InlineText[] = []
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        content.push({ type: 'text', text: child.textContent ?? '' })
      } else if (child.nodeType === 1) {
        const el = child as HTMLElement
        switch (el.rawTagName) {
          case 'em':
            content.push({ type: 'em', text: el.textContent ?? '' })
            break
          case 'strong':
            content.push({ type: 'strong', text: el.textContent ?? '' })
            break
          default:
            content.push({ type: 'text', text: el.textContent ?? '' })
        }
      }
    })

    return content
  }

  /**
   *
   * @param node
   * @returns
   */
  const extractContent = (node: Node): ContentType[] | null => {
    if (!node.rawTagName) {
      return null
    }

    const htmlElement: HTMLElement = node as HTMLElement

    switch (htmlElement.rawTagName.toLowerCase()) {
      case 'div':
        if (htmlElement.classNames && htmlElement.classNames.length > 0) {
          if (htmlElement.classNames.includes('multimedia-embed') && htmlElement.childNodes.length > 0) {
            for (let i = 0; i < htmlElement.childNodes.length; i++) {
              let child: HTMLElement = htmlElement.childNodes[i] as HTMLElement
              if (child && child.rawTagName === 'figure') {
                const figureContent = extractFigureContent(child)
                if (figureContent) return [figureContent]
              }
            }
          } else if (htmlElement.classNames.includes('twitter-tweet')) {
            // TODO: Handle twitter-tweet case
            return null
          } else if (htmlElement.classNames.startsWith('article__video-container')) {
            const videoContainer = htmlElement.querySelector('.js_player')
            if (videoContainer) {
              const provider = videoContainer.getAttribute('data-provider')
              const id = videoContainer.getAttribute('data-id')
              if (provider && id) {
                return [{ type: 'webview-video', provider, data: id }]
              }
            }
          }
        }
        break
      case 'h2':
        return [{ type: 'h2', data: node.text }]
      case 'h3':
        return [{ type: 'h3', data: node.text }]
      case 'p':
        if (htmlElement.classNames?.includes('article__paragraph')) {
          const inlineContent = extractParagraphContent(htmlElement)
          return [{ type: 'paragraph', data: inlineContent }]
        }
        break
      case 'section':
        const catcher = htmlElement.querySelector('.catcher__content')
        if (catcher) {
          const catcherDesc = catcher.querySelector('.catcher__desc')
          if (catcherDesc) {
            const readAlso = catcherDesc.querySelector('.js-article-read-also')
            if (settingsContext.hasReadAlso && readAlso) {
              const seeAlso: SeeAlsoButtonContent = {
                type: 'seeAlsoButton',
                data: readAlso.getAttribute('title') || readAlso.textContent,
                url: readAlso.attrs['href'],
                isRestricted: readAlso.getAttribute('data-premium') === '1'
              }
              return [seeAlso]
            }
          }
        }
        break
      case 'ul':
        const listItems: ContentType[] = []
        for (let i = 0; i < htmlElement.childNodes.length; i++) {
          const child = htmlElement.childNodes[i] as HTMLElement
          if (child && child.rawTagName === 'li') {
            listItems.push({ type: 'list', data: child.textContent ?? '' })
          }
        }
        return listItems
      case 'figure':
        const f = extractFigureContent(htmlElement)
        if (f) {
          return [f]
        }
    }

    return null
  }

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

      // Category and other infos in the header
      const metas = Array.from(doc.querySelectorAll('meta')).filter((meta): meta is HTMLElement => meta instanceof HTMLElement)
      const parser = new ArticleHeaderParser()
      const a = parser.parse(metas)

      const longform: HTMLElement | null = doc.getElementById('Longform')
      if (!!longform) {
        a.authors = ''
        const metasAuthors = doc.querySelectorAll('.meta__authors')
        for (const metasAuthor of metasAuthors) {
          let author = metasAuthor.querySelector('a.article__author-link')
          if (author) {
            a.authors = a.authors.concat(author.text.trim())
          }
        }
      } else if (a.authors === '' || a.authors === 'Le Monde') {
        let authors = doc.querySelectorAll('a.article__author-link')
        a.authors = authors.map((author: HTMLElement) => author.textContent.trim()).join(', ')
      }

      const main = doc.querySelector('main')
      if (!main) {
        console.warn('cannot find <main> tag')
        return
      }

      let date = main.querySelector('span.meta__date')
      if (date) {
        a.date = date.rawText
      } else {
        let d = main.querySelector('p.meta__publisher')
        if (d) {
          a.date = d.text
        }
      }

      let readTime: HTMLElement | null = main.querySelector('.meta__reading-time')
      if (readTime !== null && readTime.childNodes.length > 0) {
        let s = readTime.rawText.trim()
        if (s.startsWith('Temps de Lecture ')) {
          s = s.replace('Temps de Lecture ', '')
        }
        a.readingTime = s
      }

      // Paragraphes and images
      let par: ContentType[] = []
      par.push({ type: 'description', data: a.description })
      a.authors && par.push({ type: 'authors', data: a.authors })
      if (a.date || a.readingTime) {
        par.push({ type: 'dateReadingTime', date: a.date, readingTime: a.readingTime })
      }

      const footers = main.getElementsByTagName('footer')
      if (footers && footers.length > 0) {
        footers[0].remove()
      }

      if (longform) {
        for (const child of longform.childNodes) {
          let c = child as HTMLElement
          if (c.classNames?.includes('article__content')) {
            for (let j = 0; j < c.childNodes.length; j++) {
              let p = extractContent(c.childNodes[j])
              if (p) {
                par.push(...p)
              }
            }
          }
        }
      }
      const articles = main.getElementsByTagName('article')
      if (articles.length > 0) {
        for (const a of articles) {
          for (let j = 0; j < a.childNodes.length; j++) {
            let p = extractContent(a.childNodes[j])
            if (p) {
              par.push(...p)
            }
          }
        }
      }
      if (par.length === 1) {
        for (let i = 0; i < main.childNodes.length; i++) {
          let p = extractContent(main.childNodes[i])
          if (p) {
            par.push(...p)
          }
        }
      }
      setArticle(a)
      setParagraphes(par)
      setLoading(false)
    } catch (error) {
      setFetchFailed(true)
      setLoading(false)
    }
  }

  const renderItem = ({ item }: { item: ContentType }) => {
    switch (item.type) {
      case 'h2':
        return (
          <Text variant="titleLarge" style={styles.subtitle}>
            {item.data}
          </Text>
        )
      case 'description':
        return (
          <Card mode="elevated" style={{ margin: 8 }}>
            <Card.Content>
              <Text variant="titleMedium">{item.data}</Text>
            </Card.Content>
          </Card>
        )
      case 'authors':
        return (
          <Text variant="bodyMedium" style={styles.subtitle}>
            {i18n.t('article.authors', { authors: item.data })}
          </Text>
        )
      case 'dateReadingTime':
        return (
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {item.date && (
              <Text variant="bodyMedium" numberOfLines={2} style={{ paddingStart: 8, marginTop: 8, color: colors.outline, flexShrink: 1 }}>
                {item.date}
              </Text>
            )}
            {item.readingTime && (
              <Text variant="bodyMedium" style={[styles.subtitle, { minWidth: 100 }]}>
                <Icon name="timer-sand" size={16} />
                {item.readingTime}
              </Text>
            )}
          </View>
        )
      case 'h3':
        return (
          <Text variant="titleMedium" style={styles.subtitle}>
            {item.data}
          </Text>
        )
      case 'img':
        return (
          <View style={{ marginHorizontal: 8 }}>
            <Image
              source={{ uri: item.uri }}
              style={{ width: window.width - 16, height: item.ratio ? (window.width - 16) / item.ratio : window.width / 2 }}
            />
            {item.caption && (
              <Text variant="bodySmall" style={styles.imgCaption}>
                {item.caption}
              </Text>
            )}
          </View>
        )
      case 'list':
        return (
          <Text variant="bodyMedium" style={styles.paragraph}>
            • {item.data}
          </Text>
        )
      case 'paragraph':
        return (
          <Text variant="bodyMedium" style={styles.paragraph}>
            {item.data.map((chunk, index) => {
              switch (chunk.type) {
                case 'text':
                  return <Text key={index}>{chunk.text}</Text>
                case 'strong':
                  return (
                    <Text key={index} style={{ fontWeight: 'bold' }}>
                      {chunk.text}
                    </Text>
                  )
                case 'em':
                  return (
                    <Text key={index} style={{ fontStyle: 'italic' }}>
                      {chunk.text}
                    </Text>
                  )
                default:
                  return null
              }
            })}
          </Text>
        )
      case 'seeAlsoButton':
        let see: SeeAlsoButtonContent = item as SeeAlsoButtonContent
        return (
          <Card
            mode="elevated"
            style={{ marginStart: 24, marginEnd: 8, marginVertical: 8 }}
            onPress={() => {
              const parsed = parseAndGuessURL(item.url)
              if (parsed) {
                navigation.push(parsed.type, parsed)
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
      case 'webview-video':
        switch (item.provider) {
          case 'dailymotion':
            return <WebView source={{ uri: `https://www.dailymotion.com/embed/video/${item.data}` }} style={styles.videoContainer} />
          case 'youtube':
            return <WebView source={{ uri: `https://www.youtube.com/embed/${item.data}` }} style={styles.videoContainer} />
        }
      default:
        return null
    }
  }

  const renderCustomStatusBar = (article: ArticleHeader) => {
    const dynamicColor = settingsContext.hasDynamicStatusBarColor && article.isRestricted
    return <CustomStatusBar backgroundColor={dynamicColor ? colors.primaryContainer : 'transparent'} translucent={!dynamicColor} />
  }

  const renderFooter = (article: ArticleHeader) => (
    <>
      {article.isRestricted && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium">{i18n.t('article.restricted')}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => Linking.openURL('https://abo.lemonde.fr/')}>
              {i18n.t('article.register')}
            </Button>
          </Card.Actions>
        </Card>
      )}
      <View style={styles.footerPadding} />
    </>
  )

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {fetchFailed ? (
        <FetchError onRetry={init} />
      ) : loading || !article ? (
        <ActivityIndicator style={styles.activityIndicator} color={colors.primary} size={40} />
      ) : (
        <>
          {renderCustomStatusBar(article)}
          <FlatListWithHeaders
            disableAutoFixScroll
            headerFadeInThreshold={0.8}
            disableLargeHeaderFadeAnim={false}
            data={paragraphes}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            HeaderComponent={(props) => <HeaderComponent {...props} article={article} />}
            LargeHeaderComponent={(props) => <LargeHeaderComponent {...props} article={article} />}
            ListFooterComponent={renderFooter(article)}
          />
        </>
      )}
    </SafeAreaView>
  )
}
