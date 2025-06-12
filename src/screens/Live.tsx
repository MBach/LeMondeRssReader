import { useContext, useEffect, useState } from 'react'
import { Image, StatusBar, StyleSheet, useWindowDimensions } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ActivityIndicator, Card, List, Surface, Text, useTheme } from 'react-native-paper'
import parse, { HTMLElement, Node, NodeType } from 'node-html-parser'
import ky from 'ky'
import WebView from 'react-native-webview'
import { FlatListWithHeaders } from '@codeherence/react-native-header'

import { SettingsContext } from '../context/SettingsContext'
import {
  ArticleHeader,
  ArticleHeaderParser,
  LiveContentType,
  SectionContent,
  ParsedLink,
  parseAndGuessURL,
  SeeAlsoButtonContent,
  MainStackNavigation
} from '../types'
import DynamicNavbar from '../DynamicNavbar'
import { Api } from '../api'
import { HeaderComponent, LargeHeaderComponent } from '../components/Header'
import { IconPremium } from '../assets'
import { FetchError } from '../components/FetchError'
import { CustomStatusBar } from '../components/CustomStatusBar'

/*
function useInterval(callback: (() => Promise<void>) | undefined, delay: number) {
  const savedCallback = useRef()

  useEffect(() => {
    savedCallback.current = callback
  })

  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    if (delay !== null) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}
*/

class GetPostsRes {
  posts: string
}

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export function LiveScreen(/*FIXME { onRefresh }: { onRefresh: () => void }*/) {
  const route = useRoute()
  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()
  const window = useWindowDimensions()
  const navigation = useNavigation<MainStackNavigation>()

  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState<boolean>(false)
  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [sections, setSections] = useState<SectionContent[]>([])

  //const [latestPostId, setLatestPostId] = useState(null)
  //const [newCommentsReceived, setNewCommentsReceived] = useState(false)

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

  /*
  useInterval(async () => {
    if (latestPostId && articleId) {
      const response = await ky.get(`https://www.lemonde.fr/ajax/live/${articleId}/after/${latestPostId}`)
      if (response.ok) {
        const res = await response.json()
        if (res.elements.length > 0) {
          setNewCommentsReceived(true)
        }
      }
    }
  }, 5000)
  */

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
      const l = route.params as ParsedLink
      const response = await Api.get(`${l.category}/live/${l.yyyy}/${l.mm}/${l.dd}/${l.title}`)
      const doc = parse(await response.text())
      const metas = Array.from(doc.querySelectorAll('meta')).filter((meta): meta is HTMLElement => meta instanceof HTMLElement)
      const parser = new ArticleHeaderParser()
      const a = parser.parse(metas)

      let s: SectionContent[] = []
      const hero: HTMLElement | null = doc.querySelector('section.hero__live-content')
      if (hero !== null) {
        let section: SectionContent = {
          id: '',
          hero: false,
          hasBorder: false,
          contents: []
        }
        //const banner: HTMLElement | null = hero.querySelector('img')
        //if (banner && banner.hasAttribute('src')) {
        //  section.hero = true
        //}
        const title: HTMLElement | null = hero.querySelector('section.title')
        if (title) {
          const h1: HTMLElement | null = title.querySelector('h1')
          if (h1 && article?.title !== h1.textContent) {
            section.contents.push({ type: 'h1', data: h1.textContent })
          }
          const p: HTMLElement | null = title.querySelector('p')
          if (p) {
            section.contents.push({ type: 'h2', data: p.textContent })
          }
        }
        s.push(section)
      }
      const posts: HTMLElement | null = doc.querySelector('#post-container')
      // list of
      // <section ?border="color">
      //  <header>time + title</header>
      //  <content>
      //    <h2></h2> (once, usually)
      //    <ul><li></li></ul> (multiple)
      //    <div></div> (multiple)
      //  </content>
      // </section>
      if (posts !== null) {
        for (let i = 0; i < posts.childNodes.length; i++) {
          const node = posts.childNodes[i]
          if (node.nodeType === NodeType.ELEMENT_NODE && node.rawTagName.toLowerCase() === 'section') {
            const section = await exctractSection(node)
            if (section && section.contents.length > 0) {
              s.push(section)
            }
          }
        }
      }
      //setLatestPostId(id)
      setSections(s)
      setArticle(a)
      setLoading(false)
    } catch (error) {
      setFetchFailed(true)
      setLoading(false)
    }
  }

  /**
   *
   */
  const fetchLastPosts = async () => {
    if (article && article.id && sections.length > 10) {
      const lastSection = sections[sections.length - 1]
      console.log('about to fetch last posts', lastSection)
      const response = await ky
        .get(`https://www.lemonde.fr/ajax/live/article/${article.id}/scroll?lastPost=${lastSection.id}`)
        .json<GetPostsRes>()
      if (!response || !response.posts || response.posts.length === 0) {
        console.log('no new posts, exiting...')
        return
      }
      let s = [...sections]
      for (const post of response.posts) {
        const node = parse(post)
        const newSection = await exctractSection(node)
        if (newSection) {
          s.push(newSection)
        }
      }
      setSections(s)
    }
  }

  /**
   * Transforms a Node into a JSON-like structure in order to be displayed.
   *
   * @param node
   * @returns a new section ready to be added to a FlatList
   */
  const exctractSection = async (node: Node): Promise<SectionContent | undefined> => {
    let section: SectionContent = {
      id: '',
      hero: false,
      hasBorder: false,
      contents: []
    }
    const htmlElement: HTMLElement = node as HTMLElement
    const border = htmlElement.querySelector('.flag-live__border, .flag-live__border__label')
    if (border && border.hasAttribute('style')) {
      // Assume that inline style is always 'background-color'
      section.hasBorder = true
    }
    // Header is a single element
    const header = htmlElement.querySelector('.header-content__live > .info-content')
    if (header) {
      section.header = header.textContent.trim()
    }
    const postId = htmlElement.getAttribute('id')
    if (postId) {
      section.id = postId
    }
    // Content is a list of HTML tags: <h2>, <div>, <iframe> (e.g. tweets), etc.
    let contents = htmlElement.querySelectorAll('.content--live > *')
    if (contents.length === 0) {
      console.log('no contents, trying again')
      contents = htmlElement.querySelectorAll('.meta__social--new-live-post > *')
    }
    for (const content of contents) {
      switch (content.rawTagName) {
        case 'h2':
          section.contents.push({ type: content.rawTagName, data: content.textContent })
          break
        case 'div':
          // post__live-container--answer => classic text
          // post__live-container--comment-content => text displayed as speech bubble
          // article__video-container article__video-container--ratio => iframe for embedding a video
          // post__live-container--link-content => probably 'see also' button
          if (content.classNames === 'post__live-container--answer') {
            section.contents.push({ type: content.rawTagName, data: content.textContent })
          } else if (content.classNames === 'post__live-container--comment-content') {
            let data = content.querySelector('blockquote.post__live-container--comment-blockquote')
            let aut = content.querySelector('span.post__live-container--comment-author')
            if (data && aut) {
              section.contents.push({
                type: 'quote',
                data: data.textContent,
                author: aut.textContent
              })
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
        case 'figure':
          const img = content.querySelector('img')
          const data = img?.getAttribute('data-src')
          if (img && data) {
            section.contents.push({ type: 'img', uri: data })
          }
          const caption = content.querySelector('figcaption')
          if (caption) {
            section.contents.push({ type: 'caption', data: caption.textContent })
          }
          break
        case 'ul':
          for (const li of content.childNodes) {
            section.contents.push({ type: 'list', data: li.textContent })
          }
          break
        case 'iframe':
          const dataSrc = content.getAttribute('data-src')
          if (dataSrc) {
            section.contents.push({ type: 'iframe', data: dataSrc })
          }
          break
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
      case 'seeAlsoButton':
        let see: SeeAlsoButtonContent = content as SeeAlsoButtonContent
        return (
          <Card
            key={index}
            mode="elevated"
            style={{ marginStart: 24, marginEnd: 8, marginVertical: 8 }}
            onPress={() => {
              const parsed = parseAndGuessURL(content.url)
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
      default:
        return null
    }
  }

  const renderSection = ({ item, index }: { item: SectionContent; index: number }) => {
    let sectionStyle = {}
    if (item.hasBorder) {
      sectionStyle = { borderLeftColor: '#be1514', borderLeftWidth: 2, paddingHorizontal: 4 }
    } else {
      sectionStyle = { paddingHorizontal: 4 }
    }
    let subHeader: React.JSX.Element | null = null
    if (item.header) {
      subHeader = <List.Subheader style={{ color: item.hasBorder ? '#be1514' : colors.onSurface }}>{item.header}</List.Subheader>
    }
    return (
      <List.Section key={item.id ?? `section-${index}`} style={{ ...sectionStyle }}>
        {subHeader}
        {item.contents.map(renderContent)}
      </List.Section>
    )
  }

  return (
    <Surface elevation={0} style={{ flex: 1 }}>
      <StatusBar translucent />
      {fetchFailed ? (
        <FetchError onRetry={init} />
      ) : loading || !article ? (
        <ActivityIndicator style={{ flexGrow: 1, justifyContent: 'center' }} color={colors.primary} size={40} />
      ) : (
        <>
          {/*
          <Banner
            style={{ marginTop: 32 }}
            icon="update"
            visible={newCommentsReceived}
            actions={[
              {
                label: i18n.t('live.view'),
                onPress: () => {
                  setNewCommentsReceived(false)
                  //onRefresh()
                }
              }
            ]}>
            {i18n.t('live.newComments')}
          </Banner>
          */}
          <CustomStatusBar translucent backgroundColor={'transparent'} />
          <FlatListWithHeaders
            disableAutoFixScroll
            headerFadeInThreshold={0.8}
            disableLargeHeaderFadeAnim={false}
            data={sections}
            extraData={sections}
            keyExtractor={(_: any, index: number) => index.toString()}
            renderItem={renderSection}
            HeaderComponent={(props) => <HeaderComponent {...props} article={article} />}
            LargeHeaderComponent={(props) => <LargeHeaderComponent {...props} article={article} />}
            onEndReached={fetchLastPosts}
          />
        </>
      )}
    </Surface>
  )
}
