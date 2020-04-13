import React, { useEffect, useState } from 'react'
import { Image, View, ScrollView, StyleSheet } from 'react-native'
import { ActivityIndicator, IconButton, Paragraph, Surface, Title } from 'react-native-paper'

const styles = StyleSheet.create({})

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function LiveCommentScreen({ doc }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)

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
      if (node.tagName) {
        /*switch (node.tagName) {
          case 'h2':
            if ('' !== node.text.trim()) f.push({ type: 'h2', text: node.text })
            break
          case 'p':
            f.push({ type: 'paragraph', text: node.text })
            break
          case 'ul':
            for (let j = 0; j < node.childNodes.length; j++) {
              f.push({ type: 'listItem', text: node.childNodes[j].text })
            }
            break
        }*/
      }
    }
    setComments(c)
    setLoading(false)
  }

  const renderComments = () => {
    return comments.map((c, index) => {
      switch (c.type) {
        case 'h2':
          return (
            <Title key={index} style={styles.paddingH}>
              {f.text}
            </Title>
          )
        case 'paragraph':
          return (
            <Paragraph key={index} style={styles.paddingH}>
              {f.text}
            </Paragraph>
          )
        case 'listItem':
          return (
            <View style={{ flexDirection: 'row' }}>
              <IconButton icon="circle-medium" size={20} />
              <Paragraph key={index} style={{ flex: 1 }}>
                {f.text}
              </Paragraph>
            </View>
          )
        default:
          return false
      }
    })
  }

  return (
    <Surface style={{ flex: 1 }}>
      <ScrollView>
        {loading ? (
          <ActivityIndicator style={{ flex: 1, flexGrow: 1, justifyContent: 'center', alignContent: 'center' }} />
        ) : (
          <>{renderComments()}</>
        )}
      </ScrollView>
    </Surface>
  )
}

export default LiveCommentScreen
