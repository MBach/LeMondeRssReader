import React, { useEffect, useState } from 'react'
import { FlatList, StatusBar, StyleSheet, View } from 'react-native'
import { useTheme, ActivityIndicator, Caption, Paragraph, Snackbar, Subheading, Surface } from 'react-native-paper'
import ky from 'ky'
import { parse } from 'node-html-parser'
import i18n from '../locales/i18n'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function CommentScreen({ route }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [snackbarVisible, setSnackbarVisible] = useState(false)

  const { colors } = useTheme()

  const styles = StyleSheet.create({
    comment: {},
    response: {
      paddingLeft: 12,
      marginLeft: 8,
      borderLeftWidth: 2,
      borderLeftColor: colors.divider,
    },
    lastResponse: {
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: colors.divider,
    },
  })

  useEffect(() => {
    getComments()
  }, [currentPage])

  /**
   * Extract author, date and content from a comment.
   * Also check if comment is a response to another one or not.
   *
   * @param {*} node the comment to parse
   */
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
    const cfb = node.querySelector('section.comment__footer button')
    if (cfb) {
      comment.childCount = parseInt(cfb.getAttribute('data-children'))
    }
    return comment
  }

  /**
   * Fetch the page which contains all comments.
   */
  const getComments = async () => {
    if (currentPage === 1) {
      setLoading(true)
    }
    const page = await ky.get(`${route.params.item.link}?contributions&page=${currentPage}`)
    const doc = parse(await page.text())
    let c = [...comments]
    if (currentPage === 1) {
      const header = doc.querySelector('#comments-header')
      if (header && header.text) {
        c.push({ type: 'header', text: header.text })
      }
    }
    const commentsRiver = doc.querySelector('#comments-river')
    if (commentsRiver) {
      for (let i = 0; i < commentsRiver.childNodes.length; i++) {
        const commentNode = commentsRiver.childNodes[i]
        if (!(commentNode && commentNode.tagName && commentNode.tagName.toLowerCase() === 'section')) {
          continue
        }
        let comment = { type: 'comment', ...extractAutorAndContent(commentNode) }
        c.push(comment)
        for (let j = 0; j < commentNode.childNodes.length; j++) {
          const responseNode = commentNode.childNodes[j]
          if (responseNode) {
            let childCount = 0
            for (let k = 0; k < responseNode.childNodes.length; k++) {
              const childNode = responseNode.childNodes[k]
              if (!(childNode && childNode.tagName && childNode.tagName.toLowerCase() === 'section')) {
                continue
              }
              const response = extractAutorAndContent(childNode)
              if (response.content) {
                childCount++
                c.push({ type: 'response', ...response, isLast: childCount === comment.childCount })
              }
            }
          }
        }
      }
    }
    const pagination = doc.querySelectorAll('ul.pagination__list li.pagination__item')
    if (pagination.length > 1) {
      setPageCount(pagination.length)
    }
    setComments(c)
    if (currentPage === 1) {
      setLoading(false)
    }
  }

  /**
   * When one has scrolled down to the end, check if there are others pages to scrap.
   */
  const fetchMore = () => {
    if (currentPage < pageCount) {
      setCurrentPage(currentPage + 1)
      setSnackbarVisible(true)
    }
  }

  /**
   * Render a single comment in the FlatList.
   */
  const renderComment = ({ item }) => {
    switch (item.type) {
      case 'header':
        return <Subheading>{item.text}</Subheading>
      case 'comment':
      case 'response':
        let s
        if (item.type === 'response') {
          s = item.isLast ? [styles.response, styles.lastResponse] : styles.response
        } else {
          s = styles.comment
        }
        return (
          <View style={s}>
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
        <>
          <FlatList
            style={{ paddingTop: StatusBar.currentHeight }}
            data={comments}
            extraData={comments}
            renderItem={renderComment}
            keyExtractor={(item, index) => index.toString()}
            onEndReached={fetchMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={<View style={{ marginBottom: 40 }} />}
          />
          <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT}>
            {i18n.t('comments.fetchMore', { page: currentPage })}
          </Snackbar>
        </>
      )}
    </Surface>
  )
}
