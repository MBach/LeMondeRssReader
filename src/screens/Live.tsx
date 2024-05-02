import React, { useContext, useEffect, useRef, useState } from 'react'
import { FlatList, Image, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ActivityIndicator, Appbar, Banner, Button, List, Surface, Text, useTheme } from 'react-native-paper'
import parse, { HTMLElement, Node, NodeType } from 'node-html-parser'
import ky from 'ky'
//import WebView from 'react-native-webview'

import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'

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

interface Content {
  type: string // 'h2' | 'p' | 'figure' | 'tweet'
  data?: string
}

class Quote implements Content {
  type: string
  data: string
  author!: string
  constructor(type: string, data: string) {
    this.type = type
    this.data = data
  }
}

class SeeAlsoButton implements Content {
  type: string
  data: string
  isRestricted: boolean = false
  constructor(type: string, data: string) {
    this.type = type
    this.data = data
  }
}

class Section {
  id: string
  hero: boolean = false
  hasBorder: boolean = false
  header?: string
  contents: Content[] = []
}

class GetPostsRes {
  posts: string
}

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export default function LiveScreen(/*FIXME { onRefresh }: { onRefresh: () => void }*/) {
  const settingsContext = useContext(SettingsContext)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)
  const [articleId, setArticleId] = useState<string | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  //const [latestPostId, setLatestPostId] = useState(null)
  //const [newCommentsReceived, setNewCommentsReceived] = useState(false)
  const window = useWindowDimensions()
  const navigation = useNavigation()
  const { colors } = useTheme()

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
  }, [settingsContext.doc])

  const init = async () => {
    setLoading(true)
    if (!settingsContext.doc) {
      return
    }
    const titles = settingsContext.doc.getElementsByTagName('title')
    if (titles && titles.length > 0) {
      setTitle(titles[0].textContent)
    }

    const metas = settingsContext.doc.getElementsByTagName('meta')
    if (metas) {
      const scheme = metas.find((meta: HTMLElement) => meta.getAttribute('property') === 'al:android:url')
      if (scheme) {
        let c = scheme.getAttribute('content')
        if (c) {
          const baseUrl = c.split('?')[0]
          const segments = baseUrl.split('/')
          let id = segments.pop()
          setArticleId(id ?? null)
        }
      }
    }
    const scripts = settingsContext.doc.getElementsByTagName('script')
    if (scripts) {
      // var lmd =
    }

    let s: Section[] = []
    const hero: HTMLElement | null = settingsContext.doc.querySelector('section.hero__live-content')
    if (hero !== null) {
      let section = new Section()
      const banner: HTMLElement | null = hero.querySelector('img')
      if (banner && banner.hasAttribute('src')) {
        section.hero = true
        section.contents.push({ type: 'figure', data: banner.getAttribute('src') })
      }
      const title: HTMLElement | null = hero.querySelector('section.title')
      if (title) {
        const h1: HTMLElement | null = title.querySelector('h1')
        if (h1) {
          section.contents.push({ type: 'h1', data: h1.textContent })
        }
        const p: HTMLElement | null = title.querySelector('p')
        if (p) {
          section.contents.push({ type: 'h2', data: p.textContent })
        }
      }
      s.push(section)
    }
    const posts: HTMLElement | null = settingsContext.doc.querySelector('#post-container')
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
    setLoading(false)
  }

  /**
   *
   */
  const fetchLastPosts = async () => {
    if (articleId && sections.length > 10) {
      const lastSection = sections[sections.length - 1]
      console.log('about to fetch last posts', lastSection)
      const response = await ky
        .get(`https://www.lemonde.fr/ajax/live/article/${articleId}/scroll?lastPost=${lastSection.id}`)
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
  const exctractSection = async (node: Node): Promise<Section | undefined> => {
    let section = new Section()
    const htmlElement: HTMLElement = node as HTMLElement
    const border = htmlElement.querySelector('.flag-live__border')
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
    // console.log('no contents still')
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
            let author = content.querySelector('span.post__live-container--comment-author')
            if (data && author) {
              let q = new Quote('quote', data.textContent)
              q.author = author.textContent
              section.contents.push(q)
            }
          } else if (content.classNames === 'post__live-container--link-content') {
            const seeAlso = content.querySelector('a.js-live-read-also')
            if (seeAlso) {
              let b = new SeeAlsoButton('button', seeAlso.getAttribute('title') || seeAlso.textContent)
              section.contents.push(b)
            }
          } else {
            section.contents.push({ type: content.rawTagName, data: content.textContent })
          }
          break
        case 'figure':
          const img = content.querySelector('img')
          if (img && img.hasAttribute('data-src')) {
            section.contents.push({ type: 'figure', data: img.getAttribute('data-src') })
          }
          const caption = content.querySelector('figcaption')
          if (caption) {
            section.contents.push({ type: 'caption', data: caption.textContent })
          }
          break
        case 'ul':
          for (const li of content.childNodes) {
            section.contents.push({ type: 'li', data: li.textContent })
          }
          break
        case 'iframe':
          const dataSrc = content.getAttribute('data-src')
          if (dataSrc) {
            console.log('dataSrc', dataSrc)
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

  const renderContent = (content: Content, index: number) => {
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
        let q = content as Quote
        return (
          <Surface key={index} style={styles.quote}>
            <Text>{q.data}</Text>
            <Text variant="labelSmall" style={{ textAlign: 'right' }}>
              {q.author}
            </Text>
          </Surface>
        )
      case 'caption':
        return (
          <Text key={index} variant="labelSmall" style={styles.sm}>
            {content.data}
          </Text>
        )
      case 'figure':
        return <Image key={index} source={{ uri: content.data }} style={styles.imageHeader} />
      //case 'iframe':
      //console.log(content.data)
      //return <WebView key={index} source={{ uri: content.data! }} style={styles.iframeContainer} />
      case 'li':
        return (
          <Text key={index} variant="titleSmall" style={styles.li}>
            {content.data}
          </Text>
        )
      case 'button':
        return (
          <View key={index} style={{ flex: 1, flexDirection: 'row-reverse' }}>
            <Button compact mode="contained-tonal" onPress={() => console.log('Pressed')}>
              {content.data}
            </Button>
          </View>
        )
      default:
        return null
    }
  }

  const renderSection = ({ item, index }: { item: Section; index: number }) => {
    let subHeader
    let sectionStyle = {}
    if (item.hasBorder) {
      sectionStyle = { borderLeftColor: '#be1514', borderLeftWidth: 2 }
    }
    if (!item.hero) {
      sectionStyle = { ...sectionStyle, paddingHorizontal: 4 }
    }
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
      <Appbar.Header>
        <Appbar.BackAction onPress={navigation.goBack} />
        {title && <Appbar.Content title={title} />}
      </Appbar.Header>
      {loading ? (
        <ActivityIndicator style={{ flex: 1, flexGrow: 1, justifyContent: 'center', alignContent: 'center' }} />
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
          <FlatList
            data={sections}
            extraData={sections}
            renderItem={renderSection}
            onEndReached={fetchLastPosts}
            keyExtractor={(item: any, index: number) => index.toString()}
          />
        </>
      )}
    </Surface>
  )
}
