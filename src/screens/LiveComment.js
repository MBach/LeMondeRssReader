import React, { useEffect, useRef, useState } from 'react'
import { useWindowDimensions, Image, ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import { useTheme, ActivityIndicator, Banner, Caption, IconButton, Paragraph, Surface, Text } from 'react-native-paper'
import ky from 'ky'

import { DefaultLiveAvatar } from '../assets/Icons'
import i18n from '../locales/i18n'

const regex = /lmfr:\/\/element\/article\/(\d+).*/

function useInterval(callback, delay) {
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

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function LiveCommentScreen({ doc, onRefresh }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [articleId, setArticleId] = useState(null)
  const [latestPostId, setLatestPostId] = useState(null)
  const [newCommentsReceived, setNewCommentsReceived] = useState(false)
  const window = useWindowDimensions()

  const { colors } = useTheme()

  const styles = StyleSheet.create({
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    quote: {
      fontStyle: 'italic',
      borderLeftWidth: 2,
      paddingLeft: 12,
      marginLeft: 8,
      borderLeftColor: colors.divider,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tagContainer: {
      alignSelf: 'flex-start',
      textTransform: 'uppercase',
      paddingVertical: 2,
      paddingHorizontal: 8,
      marginVertical: 8,
      fontSize: 11,
      fontWeight: 'bold',
    },
    contentContainer: {
      paddingBottom: 24,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
  })

  useEffect(() => {
    init()
  }, [doc])

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

  const extractLiveContent = (node, liveContents) => {
    // recursive call
    if (node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        extractLiveContent(node.childNodes[i], liveContents)
      }
    }
    let lc = {}
    switch (node.tagName) {
      case 'br':
        lc.type = 'br'
        lc.text = 'br'
        break
      case 'b':
        lc.fontWeight = 'bold'
        lc.type = 'paragraph'
        lc.text = node.text
        break
      case 'em':
        lc.fontStyle = 'italic'
        lc.type = 'paragraph'
        lc.text = node.text
        break
      case undefined:
        lc.type = 'paragraph'
        lc.text = node.rawText
        break
      case 'p':
        lc.type = 'paragraph'
        lc.text = node.text
        break
      case 'strong':
        lc.fontWeight = 'bold'
        lc.type = 'paragraph'
        lc.text = node.text
        break
      case 'img':
        lc.type = 'img'
        lc.text = node.getAttribute('src')
        break
      case 'li':
        liveContents.push({ type: 'listItem', text: node.text })
        break
    }
    if (lc.type && lc.text.trim() !== '') {
      // because of 'undefined' nodes, remove duplicates
      if (liveContents.length > 0) {
        const last = liveContents[liveContents.length - 1]
        if (last.text === lc.text) {
          liveContents.pop()
        }
      }
      if (node.parentNode?.tagName === 'blockquote') {
        lc.quote = true
      }
      liveContents.push(lc)
    }
  }

  const init = async () => {
    setLoading(true)
    if (!doc) {
      return
    }
    const posts = doc.querySelector('#post-container')
    let c = []
    let id = null
    for (let i = 0; i < posts.childNodes.length; i++) {
      const node = posts.childNodes[i]
      if (node.tagName !== 'section') {
        continue
      }
      if (!id) {
        id = node.getAttribute('id')
      }
      let comment = {}

      // Article ID
      const metas = doc.querySelectorAll('meta')
      for (const meta of metas) {
        const property = meta.getAttribute('property')
        if ('al:android:url' === property) {
          const content = meta.getAttribute('content')
          const b = regex.exec(content)
          if (!articleId && b && b.length === 2) {
            setArticleId(b[1])
          }
          break
        }
      }

      // Header
      const header = node.querySelector('div.header-content__live')
      if (header) {
        const avatarImg = header.querySelector('img')
        if (avatarImg) {
          comment.avatarUri = avatarImg.getAttribute('src')
        }
        const authorName = header.querySelector('div.info-content .creator-name')
        if (authorName) {
          comment.authorName = authorName.text
        }
        const authorDate = header.querySelector('div.info-content .date')
        if (authorDate) {
          comment.authorDate = authorDate.text
        }
      }

      // Tag
      const tag = node.querySelector('.tag--live span')
      if (tag) {
        const regexStyle = /color: (#[A-F0-9]{6}); background-color: (#[A-F0-9]{6});/g
        const b = regexStyle.exec(tag.getAttribute('style'))
        comment.tagText = tag.text
        if (b && b.length === 3) {
          comment.tagStyle = { color: b[1], backgroundColor: b[2] }
        }
      }

      // Content
      const liveNodes = node.querySelectorAll('.content--live *')
      if (liveNodes) {
        let liveContents = []
        for (const liveNode of liveNodes) {
          for (let j = 0; j < liveNode.childNodes.length; j++) {
            const childNode = liveNode.childNodes[j]
            if (childNode) {
              extractLiveContent(childNode, liveContents)
            }
          }
        }
        if (liveContents.length > 0) {
          comment.liveContents = liveContents
        }
      }
      c.push(comment)
    }
    setLatestPostId(id)
    setComments(c)
    setLoading(false)
  }

  const renderLiveContents = (liveContents) => {
    let contents = []
    for (const i in liveContents) {
      const lc = liveContents[i]
      switch (lc.type) {
        case 'br':
          contents.push(<View key={i} style={{ height: 8, width: '100%', flexGrow: 1 }} />)
          break
        case 'img':
          contents.push(<Image key={i} source={{ uri: lc.text }} style={{ width: '100%', height: 200 }} />)
          break
        case 'listItem':
          contents.push(
            <View key={i} style={{ flexDirection: 'row' }}>
              <IconButton icon="circle-medium" size={20} />
              <Paragraph style={{ flex: 1 }}>{lc.text}</Paragraph>
            </View>
          )
          break
        case 'paragraph':
          let s = {
            ...styles.paddingH,
            fontStyle: lc.fontStyle ? lc.fontStyle : 'normal',
            fontWeight: lc.fontWeight ? lc.fontWeight : 'normal',
          }
          if (lc.quote) {
            s = { ...s, ...styles.quote }
          }
          contents.push(
            <Paragraph key={i} style={s}>
              {lc.text}
            </Paragraph>
          )
          break
      }
    }
    return contents
  }

  const renderComments = () => {
    let c = []
    for (const i in comments) {
      const comment = comments[i]
      c.push(
        <View key={'header-' + i} style={styles.headerContainer}>
          <Image source={comment.avatarUri ? { uri: comment.avatarUri } : DefaultLiveAvatar} style={styles.avatar} />
          <Paragraph style={{ marginHorizontal: 8 }}>{comment.authorName}</Paragraph>
          <Caption>{comment.authorDate}</Caption>
        </View>
      )
      comment.tagText &&
        c.push(
          <Text key={'tag-' + i} style={[styles.tagContainer, comment.tagStyle]}>
            {comment.tagText}
          </Text>
        )
      comment.liveContents &&
        c.push(
          <View key={'content-' + i} style={styles.contentContainer}>
            {renderLiveContents(comment.liveContents)}
          </View>
        )
    }
    return c
  }

  return (
    <Surface style={{ flex: 1, paddingHorizontal: 8 }}>
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
                  onRefresh()
                },
              },
            ]}>
            {i18n.t('live.newComments')}
          </Banner>
          <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>{renderComments()}</ScrollView>
        </>
      )}
    </Surface>
  )
}
