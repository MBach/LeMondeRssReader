import React, { useEffect, useState } from 'react'
import { Image, View, ScrollView, StyleSheet, Linking } from 'react-native'
import { useTheme, ActivityIndicator, Headline, Surface, Subheading, Paragraph, Title, Card, Button } from 'react-native-paper'
import { SharedElement } from 'react-navigation-shared-element'
import ky from 'ky'
import { parse } from 'node-html-parser'

import { IconTimer } from '../assets/Icons'
import i18n from '../locales/i18n'

const styles = StyleSheet.create({
  paddingH: {
    paddingHorizontal: 8,
  },
  imageHeader: {
    height: 200,
    resizeMode: 'stretch',
  },
})

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function ArticleScreen({ item }) {
  const { colors } = useTheme()
  const [data, setData] = useState({ title: item.title, description: item.description })
  const [paragraphes, setParagraphes] = useState([])
  const [loading, setLoading] = useState(true)

  console.log(item)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    setLoading(true)
    const response = await ky.get(item.link)
    const doc = parse(await response.text())
    const main = doc.querySelector('main')

    let d = { ...data }
    let par = []
    // Header
    //d.title = main.querySelector('h1')?.rawText
    //d.description = main.querySelector('p.article__desc')?.structuredText
    d.authors = main.querySelector('span.meta__author')?.rawText
    d.date = main.querySelector('span.meta__date')?.rawText
    d.readTime = main.querySelector('p.meta__reading-time')?.lastChild.rawText
    d.isRestricted = main.querySelector('p.article__status') !== null

    // Paragraphes and images
    const article = main.querySelector('article')

    for (let i = 0; i < article.childNodes.length; i++) {
      const node = article.childNodes[i]
      //console.log(node.tagName)
      if (node.tagName) {
        //console.log('node', node)
        switch (
          node.tagName
          //
        ) {
        }
      } else {
      }
      if (node && node.classNames && node.classNames.length > 0) {
        if (node.classNames.includes('article__paragraph')) {
          par.push({ type: 'paragraph', text: node.text })
        } else {
          const h2 = node.querySelector('h2')
          if (h2) {
            par.push({ type: 'h2', text: h2.text })
          } else {
            //const img = node.querySelectorAll('picture.article__media')
            //console.log('img', img)
          }
        }
      }
    }
    setData(d)
    setParagraphes(par)
    setLoading(false)
  }

  const renderParagraphes = () => {
    return paragraphes.map((p, index) => {
      switch (p.type) {
        case 'paragraph':
          return (
            <Paragraph key={index} style={styles.paddingH}>
              {p.text}
            </Paragraph>
          )
        case 'h2':
          return (
            <Title key={index} style={styles.paddingH}>
              {p.text}
            </Title>
          )
        default:
          return false
      }
    })
  }

  return (
    <Surface style={{ flex: 1 }}>
      <ScrollView>
        <SharedElement id={`item.${item.id}.photo`}>
          <Image source={{ uri: item.uri }} style={styles.imageHeader} />
        </SharedElement>
        <Headline style={styles.paddingH}>{data.title}</Headline>
        <Subheading style={styles.paddingH}>{data.description}</Subheading>
        {loading ? (
          <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignContent: 'center', height: '100%' }} />
        ) : (
          <>
            <Paragraph style={styles.paddingH}>{data.authors}</Paragraph>
            <Paragraph style={styles.paddingH}>{data.date}</Paragraph>
            <View style={{ ...styles.paddingH, flexDirection: 'row' }}>
              <Image source={IconTimer} style={{ width: 24, height: 24, tintColor: colors.text, marginEnd: 8, marginBottom: 4 }} />
              <Paragraph>{data.readTime}</Paragraph>
            </View>
          </>
        )}
        {renderParagraphes()}
        {data.isRestricted && (
          <Card style={{ marginVertical: 8 }}>
            <Card.Content>
              <Paragraph>{i18n.t('article.restricted')}</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => Linking.openURL('https://abo.lemonde.fr/')}>
                {i18n.t('article.register')}
              </Button>
            </Card.Actions>
          </Card>
        )}
      </ScrollView>
    </Surface>
  )
}

export default ArticleScreen
