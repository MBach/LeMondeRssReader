import React, { useEffect, useState } from 'react'
import { useWindowDimensions, Image, View, ScrollView, StyleSheet, Linking, StatusBar } from 'react-native'
import { SharedElement } from 'react-navigation-shared-element'
import { useTheme, ActivityIndicator, Button, Card, Headline, Paragraph, Subheading, Surface, Title, Caption } from 'react-native-paper'

import { IconTimer, DefaultImageFeed } from '../assets/Icons'
import i18n from '../locales/i18n'

const styles = StyleSheet.create({
  paddingH: {
    paddingHorizontal: 8,
  },
  imageHeader: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
})

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function ArticleScreen({ doc, item }) {
  const { colors } = useTheme()
  const [data, setData] = useState({ title: item.title, description: item.description })
  const [paragraphes, setParagraphes] = useState([])
  const [loading, setLoading] = useState(true)
  const window = useWindowDimensions()

  useEffect(() => {
    init()
  }, [doc])

  const init = async () => {
    setLoading(true)
    if (!doc) {
      return
    }
    const main = doc.querySelector('main')

    let d = { ...data }
    let par = []
    // Header
    d.authors = main.querySelector('span.meta__author')?.rawText
    d.date = main.querySelector('span.meta__date')?.rawText
    d.readTime = main.querySelector('.meta__reading-time')?.lastChild.rawText
    d.isRestricted = main.querySelector('p.article__status') !== null

    // Paragraphes and images
    const article = main.querySelector('article')

    for (let i = 0; i < article.childNodes.length; i++) {
      const node = article.childNodes[i]
      if (node.tagName) {
        switch (node.tagName) {
          case 'h2':
            par.push({ type: 'h2', text: node.text })
            break
          case 'p':
            if (node && node.classNames && node.classNames.length > 0) {
              if (node.classNames.includes('article__paragraph')) {
                par.push({ type: 'paragraph', text: node.text })
              }
            }
            break
          case 'figure':
            const img = node.querySelector('img')
            if (img) {
              let imgSrc = img.getAttribute('src')
              if (!imgSrc) {
                imgSrc = img.getAttribute('data-src')
              }
              let caption = null
              if (imgSrc) {
                const figcaption = node.querySelector('figcaption')
                if (figcaption && figcaption.text) {
                  caption = figcaption.text
                }
              } else {
                break
              }
              const regex = /https:\/\/img\.lemde.fr\/\d+\/\d+\/\d+\/\d+\/\d+\/(\d+)\/(\d+)\/.*/g
              const b = regex.exec(imgSrc)
              let ratio
              if (b && b.length === 3) {
                ratio = b[1] / b[2]
              } else {
                ratio = 1.5
              }
              par.push({ type: 'img', uri: imgSrc, ratio, caption })
            }
            break
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
        case 'h2':
          return (
            <Title key={index} style={styles.paddingH}>
              {p.text}
            </Title>
          )
        case 'paragraph':
          return (
            <Paragraph key={index} style={styles.paddingH}>
              {p.text}
            </Paragraph>
          )
        case 'img':
          return (
            <View key={index} style={{ marginHorizontal: 8 }}>
              <Image source={{ uri: p.uri }} style={{ width: window.width - 16, height: (window.width - 16) / p.ratio }} />
              {p.caption && (
                <Caption style={{ position: 'absolute', bottom: -2, padding: 4, backgroundColor: 'rgba(0,0,0,0.5)' }}>{p.caption}</Caption>
              )}
            </View>
          )
        default:
          return false
      }
    })
  }

  return (
    <Surface style={{ flex: 1 }}>
      {data.isRestricted && <StatusBar backgroundColor={'rgba(255,196,0,1.0)'} barStyle="dark-content" animated />}
      <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
        <SharedElement id={`item.${item.id}.photo`}>
          <Image source={item.uri ? { uri: item.uri } : DefaultImageFeed} style={styles.imageHeader} />
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
          <Card style={{ margin: 8 }}>
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
        <View style={{ paddingBottom: 40 }} />
      </ScrollView>
    </Surface>
  )
}

export default ArticleScreen
