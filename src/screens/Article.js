import React, { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, Image, Linking, ScrollView, Share, StatusBar, StyleSheet, View } from 'react-native'
import { SharedElement } from 'react-navigation-shared-element'
import {
  useTheme,
  ActivityIndicator,
  Button,
  Caption,
  Card,
  Headline,
  IconButton,
  Paragraph,
  Snackbar,
  Subheading,
  Surface,
  Title,
} from 'react-native-paper'

import { IconTimer, DefaultImageFeed } from '../assets/Icons'
import { SettingsContext } from '../context/SettingsContext'
import i18n from '../locales/i18n'
import { StackActions } from '@react-navigation/native'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function ArticleScreen({ navigation, route, doc, url }) {
  const { colors } = useTheme()
  const { settingsContext } = useContext(SettingsContext)
  const [shared, setShared] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)

  const [data, setData] = useState({ title: route.params?.item?.title, description: route.params?.item?.description })
  const [item, setItem] = useState({ id: route.params?.item?.id, uri: route.params?.item?.uri })

  const [paragraphes, setParagraphes] = useState([])
  const [loading, setLoading] = useState(true)
  const window = useWindowDimensions()

  const styles = StyleSheet.create({
    paddingH: {
      paddingHorizontal: 8,
    },
    imageHeader: {
      width: window.width,
      height: 200,
      resizeMode: 'contain',
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

    const share = await settingsContext.getShare()
    const isShared = share === null || share === '1'
    setShared(isShared)

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
      }
      if (!route.params?.item?.uri && 'og:image' === property) {
        d.imgUri = meta.getAttribute('content')
      }
    }

    setItem({ ...item, imgUri: d.imgUri, title: d.title, description: d.description, category: d.category, link: d.link })

    let author = main.querySelector('span.meta__author')
    if (author) {
      d.authors = author.rawText
    } else {
      author = main.querySelector('span.meta__authors')
      d.authors = author.text
    }
    let date = main.querySelector('span.meta__date')
    if (date) {
      d.date = date.rawText
    } else {
      d.date = main.querySelector('p.meta__publisher')?.text
    }
    d.readTime = main.querySelector('.meta__reading-time')?.lastChild.rawText
    d.isRestricted = main.querySelector('p.article__status') !== null
    navigation.setOptions({ tabBarVisible: !d.isRestricted })

    setIsFavorite(await settingsContext.hasFavorite(d.link))

    // Paragraphes and images
    const article = main.querySelector('article')
    let par = []
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

  const shareContent = async () => {
    try {
      await Share.share({ title: `Le monde.fr : ${item.title}`, message: data.link })
    } catch (error) {
      // nothing
    }
  }

  const toggleFavorite = async () => {
    setIsFavorite(!isFavorite)
    await settingsContext.toggleFavorite(item)
    setSnackbarVisible(true)
  }

  const renderHeader = () => (
    <View style={{ flexDirection: 'row', height: 200 }}>
      {item && item.uri ? (
        <View style={{ position: 'absolute' }}>
          <SharedElement id={`item.${item.id}.photo`}>
            <Image source={{ uri: item.uri }} style={styles.imageHeader} />
          </SharedElement>
        </View>
      ) : (
        <Image source={data.imgUri ? { uri: data.imgUri } : DefaultImageFeed} style={{ position: 'absolute', ...styles.imageHeader }} />
      )}
      <IconButton icon="arrow-left" size={20} onPress={() => navigation.dispatch(StackActions.replace('Drawer'))} />
      <View style={{ flexGrow: 1 }} />
      {!loading && shared && <IconButton icon="share-variant" size={20} onPress={shareContent} />}
      {!loading && (
        <IconButton
          animated
          icon={isFavorite ? 'star' : 'star-outline'}
          size={20}
          color={isFavorite ? colors.accent : colors.text}
          onPress={toggleFavorite}
        />
      )}
    </View>
  )

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
        {renderHeader()}
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
      {snackbarVisible && (
        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT}>
          {isFavorite ? i18n.t('article.favAdded') : i18n.t('article.favRemoved')}
        </Snackbar>
      )}
    </Surface>
  )
}
