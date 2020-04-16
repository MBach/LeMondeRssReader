import React, { useEffect, useState } from 'react'
import { Image, View, ScrollView, StyleSheet, StatusBar } from 'react-native'
import { useTheme, ActivityIndicator, Caption, Paragraph, Surface, Text, Subheading } from 'react-native-paper'
import { DefaultLiveAvatar } from '../assets/Icons'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function LiveCommentScreen({ doc }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    quote: {
      fontStyle: 'italic',
      borderLeftWidth: 2,
      paddingLeft: 12,
      marginLeft: 8,
      borderLeftColor: colors.divider,
    },
  })

  useEffect(() => {
    init()
  }, [doc])

  const init = async () => {
    setLoading(true)
    if (!doc) {
      return
    }
    const posts = doc.querySelector('#post-container')
    let c = []
    for (let i = 0; i < posts.childNodes.length; i++) {
      const node = posts.childNodes[i]
      if (node.tagName !== 'section') {
        continue
      }
      let comment = {}
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
              let lc = {}
              switch (childNode.tagName) {
                case 'em':
                  lc.fontStyle = 'italic'
                case undefined:
                case 'p':
                  lc.type = 'paragraph'
                  lc.text = childNode.text
                  break
                case 'strong':
                  lc.type = 'subheading'
                  lc.text = childNode.text
                  break
                case 'blockquote':
                  lc.type = 'quote'
                  lc.text = childNode.text
                  break
                case 'img':
                  lc.type = 'img'
                  lc.text = childNode.getAttribute('src')
                  break
              }
              if (lc.type && lc.text.trim() !== '') {
                liveContents.push(lc)
              }
            }
          }
        }
        if (liveContents.length > 0) {
          comment.liveContents = liveContents
        }
      }
      c.push(comment)
    }
    setComments(c)
    setLoading(false)
  }

  const renderLiveContents = (liveContents) => {
    let contents = []
    for (const i in liveContents) {
      const lc = liveContents[i]
      switch (lc.type) {
        case 'img':
          contents.push(<Image key={i} source={{ uri: lc.text }} style={{ width: '100%', height: 200 }} />)
          break
        case 'paragraph':
          contents.push(
            <Paragraph key={i} style={{ ...styles.paddingH, fontStyle: lc.fontStyle ? lc.fontStyle : 'normal' }}>
              {lc.text}
            </Paragraph>
          )
          break
        case 'quote':
          contents.push(
            <Paragraph key={i} style={styles.quote}>
              {lc.text}
            </Paragraph>
          )
          break
        case 'subheading':
          contents.push(
            <Subheading key={i} style={styles.paddingH}>
              {lc.text}
            </Subheading>
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
        <View key={i} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={comment.avatarUri ? { uri: comment.avatarUri } : DefaultLiveAvatar}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
            <Paragraph style={{ marginHorizontal: 8 }}>{comment.authorName}</Paragraph>
            <Caption>{comment.authorDate}</Caption>
          </View>
          {comment.tagText && (
            <View style={{ flexWrap: 'wrap' }}>
              <Text
                style={{
                  textTransform: 'uppercase',
                  paddingVertical: 2,
                  paddingHorizontal: 8,
                  marginVertical: 8,
                  fontSize: 11,
                  fontWeight: 'bold',
                  ...comment.tagStyle,
                }}>
                {comment.tagText}
              </Text>
            </View>
          )}
          {comment.liveContents && renderLiveContents(comment.liveContents)}
        </View>
      )
    }
    return c
  }

  return (
    <Surface style={{ flex: 1, paddingHorizontal: 8, paddingTop: 8 }}>
      <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
        {loading ? (
          <ActivityIndicator style={{ flex: 1, flexGrow: 1, justifyContent: 'center', alignContent: 'center' }} />
        ) : (
          renderComments()
        )}
      </ScrollView>
    </Surface>
  )
}

export default LiveCommentScreen
