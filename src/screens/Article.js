import React, { useEffect, useState } from 'react'
import { useWindowDimensions, Image, Linking, ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import { useTheme, ActivityIndicator, Button, Caption, Card, Headline, Paragraph, Subheading, Surface, Title } from 'react-native-paper'

import { IconTimer } from '../assets/Icons'
import Header from '../components/Header'
import i18n from '../locales/i18n'
import WebView from 'react-native-webview'

const regex = /https:\/\/img\.lemde.fr\/\d+\/\d+\/\d+\/\d+\/\d+\/(\d+)\/(\d+)\/.*/

const styles = StyleSheet.create({
  paddingH: {
    paddingHorizontal: 8,
  },
  imgCaption: {
    position: 'absolute',
    bottom: -2,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  podcastContainer: {
    width: '100%',
    height: 460,
  },
})

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function ArticleScreen({ navigation, route, doc, url }) {
  const { colors } = useTheme()
  const [data, setData] = useState({ title: route.params?.item?.title, description: route.params?.item?.description })
  const [item, setItem] = useState({ id: route.params?.item?.id, uri: route.params?.item?.uri })

  const [paragraphes, setParagraphes] = useState([])
  const [loading, setLoading] = useState(true)
  const window = useWindowDimensions()

  useEffect(() => {
    init()
  }, [doc])

  const extractContent = (node, contents) => {
    // recursive call
    if (node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        extractContent(node.childNodes[i], contents)
      }
    }
    if (!node.tagName) {
      return
    }
    switch (node.tagName) {
      case 'div':
        if (node.classNames && node.classNames.length > 0 && node.classNames.includes('multimedia-embed') && node.childNodes[0]) {
          const dataWidgetSrc = node.childNodes[0].getAttribute('data-widget-src')
          if (dataWidgetSrc) {
            contents.push({ type: 'podcast', uri: dataWidgetSrc })
          }
        }
        break
      case 'h2':
        contents.push({ type: 'h2', text: node.text })
        break
      case 'p':
        if (node.classNames && node.classNames.length > 0) {
          if (node.classNames.includes('article__paragraph')) {
            contents.push({ type: 'paragraph', text: node.text })
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
          const b = regex.exec(imgSrc)
          let ratio
          if (b && b.length === 3) {
            ratio = b[1] / b[2]
          } else {
            ratio = 1.5
          }
          contents.push({ type: 'img', uri: imgSrc, ratio, caption })
        }
        break
    }
  }

  const init = async () => {
    setLoading(true)
    if (!doc) {
      return
    }

    let d = { ...data }
    const main = doc.querySelector('main')

    // Header
    // Check if user has open this Article from the Home or from an external App like Firefox
    if (route.params?.item) {
      d.link = route.params.item.link
      d.title = route.params.item.title
      d.description = route.params.item.description
    } else {
      d.link = url
      d.title = main.querySelector('h1')?.rawText
      d.description = main.querySelector('p.article__desc')?.text.trim()
    }

    // Category
    const metas = doc.querySelectorAll('meta')
    for (const meta of metas) {
      const property = meta.getAttribute('property')
      if ('og:article:section' === property) {
        d.category = meta.getAttribute('content')
      } else if ('og:article:author' === property) {
        d.authors = meta.getAttribute('content')
      }
      if (!route.params?.item?.uri && 'og:image' === property) {
        d.imgUri = meta.getAttribute('content')
      }
    }

    setItem({ ...item, imgUri: d.imgUri, title: d.title, description: d.description, category: d.category, link: d.link })

    let date = main.querySelector('span.meta__date')
    if (date) {
      d.date = date.rawText
    } else {
      d.date = main.querySelector('p.meta__publisher')?.text
    }
    d.readTime = main.querySelector('.meta__reading-time')?.lastChild.rawText
    d.isRestricted = main.querySelector('p.article__status') !== null
    navigation.setOptions({ tabBarVisible: !d.isRestricted })

    // Paragraphes and images
    const article = main.querySelector('article')
    let par = []
    for (let i = 0; i < article.childNodes.length; i++) {
      extractContent(article.childNodes[i], par)
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
        case 'img':
          return (
            <View key={index} style={{ marginHorizontal: 8 }}>
              <Image source={{ uri: p.uri }} style={{ width: window.width - 16, height: (window.width - 16) / p.ratio }} />
              {p.caption && <Caption style={styles.imgCaption}>{p.caption}</Caption>}
            </View>
          )
        case 'paragraph':
          return (
            <Paragraph key={index} style={styles.paddingH}>
              {p.text}
            </Paragraph>
          )
        case 'podcast':
          return <WebView key={index} source={{ uri: p.uri }} style={styles.podcastContainer} />
        default:
          return false
      }
    })
  }

  const renderRestrictedCard = () =>
    data.isRestricted && (
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
    )

  return (
    <Surface style={{ flex: 1 }}>
      {data.isRestricted && <StatusBar backgroundColor={'rgba(255,196,0,1.0)'} barStyle="dark-content" animated />}
      <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
        <Header data={data} item={item} loading={loading} />
        <Headline style={styles.paddingH}>{data.title}</Headline>
        <Subheading style={styles.paddingH}>{data.description}</Subheading>
        {loading ? (
          <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignContent: 'center', height: '100%' }} />
        ) : (
          <>
            <Paragraph style={styles.paddingH}>{data.authors}</Paragraph>
            <Paragraph style={styles.paddingH}>{data.date}</Paragraph>
            {data.readTime && (
              <View style={{ ...styles.paddingH, flexDirection: 'row' }}>
                <Image source={IconTimer} style={{ width: 24, height: 24, tintColor: colors.text, marginEnd: 8, marginBottom: 4 }} />
                <Paragraph>{data.readTime}</Paragraph>
              </View>
            )}
          </>
        )}
        {renderParagraphes()}
        {renderRestrictedCard()}
        <View style={{ paddingBottom: 40 }} />
      </ScrollView>
    </Surface>
  )
}
