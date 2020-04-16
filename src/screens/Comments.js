import React, { useEffect, useState } from 'react'
import { FlatList, StatusBar, StyleSheet, View } from 'react-native'
import { useTheme, ActivityIndicator, Caption, Paragraph, Subheading, Surface } from 'react-native-paper'
import ky from 'ky'
import { parse } from 'node-html-parser'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function CommentScreen({ navigation, item }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    comment: {},
    response: {
      paddingLeft: 8,
      borderLeftWidth: 2,
      paddingLeft: 12,
      marginLeft: 8,
      borderLeftColor: colors.divider,
    },
  })

  useEffect(() => {
    getComments()
  }, [currentPage])

  const extractAutorAndContent = (node) => {
    let comment = {}
    const ch = node.querySelector('p.comment__header')
    if (ch) {
      const author = ch.querySelector('span.comment__author')
      if (author) {
        comment.author = author.text
      }
      const date = ch.querySelector('span.comment__date')
      if (date) {
        comment.date = date.text
      }
    }
    const cc = node.querySelector('p.comment__content')
    if (cc) {
      comment.content = cc.text
    }
    return comment
  }

  const getComments = async () => {
    if (currentPage === 1) {
      setLoading(true)
    }
    const page = await ky.get(`${item.link}?contributions&page=${currentPage}`)
    const doc = parse(await page.text())
    const header = doc.querySelector('#comments-header')
    let c = [...comments]
    c.push({ type: 'header', text: header.text })
    const commentsRiver = doc.querySelector('#comments-river')
    if (commentsRiver) {
      for (let i = 0; i < commentsRiver.childNodes.length; i++) {
        const commentNode = commentsRiver.childNodes[i]
        if (!(commentNode && commentNode.tagName === 'section')) {
          continue
        }
        c.push({ type: 'comment', ...extractAutorAndContent(commentNode) })
        const cResponses = commentNode.querySelector('section.comment__children')
        /*if (!(cResponses.childNodes && cResponses.childNodes.length > 0)) {
          continue
        }
        for (let j = 0; j < cResponses.childNodes.length; j++) {
          if (cResponses.childNodes[j]) {
            console.log(cResponses.childNodes[j].nodeType)
            //const response = extractAutorAndContent(cResponses.childNodes[j])
            //console.log(response.author)
            //if (response.content) {
            //  c.push({ type: 'response', ...response })
            //}
          }
        }*/
      }
    }
    setComments(c)
    if (currentPage === 1) {
      setLoading(false)
    }
  }

  const fetchMore = () => {
    console.log('todo')
    //await getComments()
  }

  const renderComment = ({ item }) => {
    switch (item.type) {
      case 'header':
        return <Subheading>{item.text}</Subheading>
      case 'comment':
      case 'response':
        return (
          <View style={item.type === 'response' ? styles.response : styles.comment}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Subheading>{item.author}</Subheading>
              <Caption style={{ marginLeft: 8 }}>{item.date}</Caption>
            </View>
            <Paragraph>{item.content}</Paragraph>
          </View>
        )
      default:
        return false
    }
  }

  return (
    <Surface style={{ flex: 1, paddingHorizontal: 8, paddingTop: 8 }}>
      {loading ? (
        <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignContent: 'center', height: '100%' }} />
      ) : (
        <FlatList
          style={{ paddingTop: StatusBar.currentHeight }}
          data={comments}
          extraData={comments}
          renderItem={renderComment}
          keyExtractor={(item, index) => index.toString()}
          onEndReached={fetchMore}
        />
      )}
    </Surface>
  )
}

export default CommentScreen
