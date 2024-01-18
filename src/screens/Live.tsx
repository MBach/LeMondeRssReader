import React, { useContext, useEffect, useRef, useState } from 'react'
import { FlatList, Image, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native'
import { ActivityIndicator, Banner, List, Surface, Text } from 'react-native-paper'
import ky from 'ky'

import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'
import { HTMLElement, NodeType } from 'node-html-parser'

const regex = /lmfr:\/\/element\/article\/(\d+).*/

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

interface Content {
  type: string // 'h2' | 'p' | 'figure' | 'tweet'
  data?: string
}

class Section {
  hero: boolean = false
  hasBorder: boolean = false
  header?: string
  contents: Content[] = []
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
  const [articleId, setArticleId] = useState(null)
  const [latestPostId, setLatestPostId] = useState(null)
  const [newCommentsReceived, setNewCommentsReceived] = useState(false)
  const window = useWindowDimensions()

  const styles = StyleSheet.create({
    imageHeader: {
      width: window.width,
      height: 250,
      resizeMode: 'cover'
    },
    sm: {
      marginBottom: 8
    }
  })

  useEffect(() => {
    init()
  }, [settingsContext.doc])

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

  const init = async () => {
    setLoading(true)
    if (!settingsContext.doc) {
      return
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
    let id = null

    if (posts !== null) {
      for (let i = 0; i < posts.childNodes.length; i++) {
        const node = posts.childNodes[i]
        if (node.nodeType === NodeType.ELEMENT_NODE && node.rawTagName.toLowerCase() === 'section') {
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
          // Content is a list of HTML tags: <h2>, <div>, <iframe> (e.g. tweets), etc.
          const contents = htmlElement.querySelectorAll('.content--live > *')
          for (const content of contents) {
            switch (content.rawTagName) {
              case 'h2':
                section.contents.push({ type: content.rawTagName, data: content.textContent })
                break
              case 'div':
                section.contents.push({ type: content.rawTagName, data: content.textContent })
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
              default:
                break
            }
          }
          s.push(section)
        }
      }
    }
    setLatestPostId(id)
    setSections(s)
    setLoading(false)
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
      case 'caption':
        return (
          <Text key={index} variant="labelSmall" style={styles.sm}>
            {content.data}
          </Text>
        )
      case 'figure':
        return <Image source={{ uri: content.data }} style={styles.imageHeader} />
      case 'tweet':
        break
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
      subHeader = <List.Subheader>{item.header}</List.Subheader>
    }
    return (
      <List.Section key={`section-${index}`} style={{ ...sectionStyle }}>
        {subHeader}
        {item.contents.map(renderContent)}
      </List.Section>
    )
  }

  return (
    <Surface style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator style={{ flex: 1, flexGrow: 1, justifyContent: 'center', alignContent: 'center' }} />
      ) : (
        <>
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
          <FlatList
            data={sections}
            extraData={sections}
            renderItem={renderSection}
            keyExtractor={(item: any, index: number) => index.toString()}
          />
        </>
      )}
    </Surface>
  )
}
