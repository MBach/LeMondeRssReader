import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { useRouter } from 'expo-router'
import { useContext, useState } from 'react'
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper'
import Carousel from 'react-native-reanimated-carousel'
import WebView from 'react-native-webview'

import { IconPremium } from '../../assets'
import { SettingsContext } from '../context/SettingsContext'
import { i18n } from '../locales/i18n'
import { ArticleType, CarouselCard, ContentType, MenuEntry, SeeAlsoButtonContent, parseAndGuessURL } from '../types'

type Props = {
  item: ContentType
}

export function ArticleItem({ item }: Props) {
  const [openCarousel, setOpenCarousel] = useState(false)
  const { colors } = useTheme()
  const window = useWindowDimensions()
  const settingsContext = useContext(SettingsContext)
  const router = useRouter()

  const styles = StyleSheet.create({
    subtitle: { paddingHorizontal: 8, marginTop: 8 },
    paragraph: { paddingHorizontal: 8, marginTop: 8 },
    imgCaption: {
      position: 'absolute',
      bottom: -2,
      padding: 4,
      backgroundColor: 'rgba(0,0,0,0.5)'
    },
    videoContainer: {
      marginTop: 20,
      width: window.width,
      height: (window.width * 9) / 16
    },
    carouselContainer: {
      marginHorizontal: 8,
      backgroundColor: colors.elevation.level2,
      maxWidth: window.width - 16
    },
    carouselContent: { display: 'flex', flexDirection: 'row' },
    carouselIconPremium: {
      marginRight: 8,
      width: 18,
      height: 18,
      backgroundColor: colors.primaryContainer,
      tintColor: colors.onPrimaryContainer
    },
    carouselData: { paddingTop: 8, maxWidth: window.width / 1.9, paddingEnd: 4 },
    carouselImg: { resizeMode: 'cover', width: 120, height: 108 }
  })

  const navigateTo = (url: string) => {
    const parsed = parseAndGuessURL(url)
    if (!parsed) return
    const { category: c, yyyy: y, mm: m, dd: d, title: t, type } = parsed
    switch (type) {
      case ArticleType.ARTICLE:
        router.push(`/(tabs)/(home)/${c}/article/${y}/${m}/${d}/${t}`)
        break
      case ArticleType.LIVE:
        router.push(`/(tabs)/(home)/${c}/live/${y}/${m}/${d}/${t}`)
        break
      case ArticleType.VIDEO:
        router.push(`/(tabs)/(home)/${c}/video/${y}/${m}/${d}/${t}`)
        break
      case ArticleType.PODCAST:
        router.push(`/(tabs)/(home)/${c}/podcast/${y}/${m}/${d}/${t}`)
        break
    }
  }

  const renderCarouselCard = (info: CarouselCard) => (
    <Card style={styles.carouselContainer} onPress={() => navigateTo(info.link)}>
      <Card.Content style={styles.carouselContent}>
        <View style={{ flex: 1 }}>
          <View style={styles.carouselContent}>
            {info.premium && <Image source={IconPremium} style={styles.carouselIconPremium} />}
            <Text variant="labelLarge">{info.episode}</Text>
          </View>
          <Text variant="bodyMedium" numberOfLines={5} style={styles.carouselData}>
            {info.data}
          </Text>
        </View>
        <Image source={{ uri: info.img }} style={styles.carouselImg} />
      </Card.Content>
    </Card>
  )

  switch (item.type) {
    case 'h2':
      return (
        <Text variant="titleLarge" style={styles.subtitle}>
          {item.data}
        </Text>
      )

    case 'h3':
      return (
        <Text variant="titleMedium" style={styles.subtitle}>
          {item.data}
        </Text>
      )

    case 'description':
      return (
        <Card mode="elevated" style={{ margin: 8 }}>
          <Card.Content>
            <Text variant="titleMedium">{item.data}</Text>
          </Card.Content>
        </Card>
      )

    case 'authors':
      return (
        <Text variant="bodyMedium" style={styles.subtitle}>
          {i18n.t('article.authors', { authors: item.data })}
        </Text>
      )

    case 'dateReadingTime':
      return (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {item.date && (
            <Text variant="bodyMedium" numberOfLines={2} style={{ paddingStart: 8, marginTop: 8, color: colors.outline, flexShrink: 1 }}>
              {item.date}
            </Text>
          )}
          {item.readingTime && (
            <Text variant="bodyMedium" style={[styles.subtitle, { minWidth: 100 }]}>
              <Icon name="timer-sand" size={16} />
              {item.readingTime}
            </Text>
          )}
        </View>
      )

    case 'carousel':
      return (
        <View style={{ margin: 8 }}>
          <View style={{ display: 'flex', marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, flexWrap: 'wrap', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                mode="contained"
                icon="newspaper-variant"
                size={20}
                onPress={async () => {
                  if (item.category) {
                    const c: MenuEntry = {
                      cat: item.category,
                      name: item.data,
                      uri: item.category.replaceAll('/', '') + '/rss_full.xml',
                      isTranslatable: false
                    }
                    await settingsContext.setCurrentCategory(c)
                    router.push('/(tabs)/(home)')
                  }
                }}
              />
              <Text variant="bodyMedium" numberOfLines={2} style={{ flex: 1, flexWrap: 'wrap' }}>
                {item.data}
              </Text>
            </View>
            <Button
              style={{ flexWrap: 'nowrap' }}
              mode="contained-tonal"
              icon={openCarousel ? 'chevron-up' : 'chevron-down'}
              onPress={() => setOpenCarousel(!openCarousel)}>
              <Text>{item.button}</Text>
            </Button>
          </View>
          {openCarousel && (
            <Carousel
              autoPlayInterval={2000}
              data={item.cards}
              height={180}
              width={window.width - 16}
              renderItem={(i) => renderCarouselCard(i.item)}
            />
          )}
        </View>
      )

    case 'img':
      return (
        <View style={{ marginHorizontal: 8, marginBottom: 12 }}>
          <Image
            source={{ uri: item.uri }}
            style={{
              width: window.width - 16,
              height: item.ratio ? (window.width - 16) / item.ratio : window.width / 2
            }}
          />
          {item.caption && (
            <Text variant="bodySmall" style={styles.imgCaption}>
              {item.caption}
            </Text>
          )}
        </View>
      )

    case 'list':
      return (
        <Text variant="bodyMedium" style={styles.paragraph}>
          • {item.data}
        </Text>
      )

    case 'paragraph':
      return (
        <Text variant="bodyMedium" style={styles.paragraph}>
          {item.data.map((chunk, index) => {
            switch (chunk.type) {
              case 'kicker':
                return (
                  <Text variant="titleMedium" key={index} style={{ margin: 8 }}>
                    {chunk.text}
                    {`  `}
                  </Text>
                )
              case 'text':
                return <Text key={index}>{chunk.text}</Text>
              case 'strong':
                return (
                  <Text key={index} style={{ fontWeight: 'bold' }}>
                    {chunk.text}
                  </Text>
                )
              case 'em':
                return (
                  <Text key={index} style={{ fontStyle: 'italic' }}>
                    {chunk.text}
                  </Text>
                )
              default:
                return null
            }
          })}
        </Text>
      )

    case 'seeAlsoButton': {
      const see = item as SeeAlsoButtonContent
      return (
        <Card mode="elevated" style={{ marginStart: 24, marginEnd: 8, marginVertical: 8 }} onPress={() => navigateTo(item.url)}>
          <Card.Content style={{ flexDirection: 'row', marginEnd: 8 }}>
            {see.isRestricted && (
              <Image
                source={IconPremium}
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: colors.primaryContainer,
                  tintColor: colors.onPrimaryContainer,
                  marginRight: 8
                }}
              />
            )}
            <Text variant="bodyMedium" numberOfLines={3}>
              {see.data}
            </Text>
          </Card.Content>
        </Card>
      )
    }

    case 'webview-video':
      switch (item.provider) {
        case 'dailymotion':
          return <WebView source={{ uri: `https://www.dailymotion.com/embed/video/${item.data}` }} style={styles.videoContainer} />
        case 'youtube':
          return <WebView source={{ uri: `https://www.youtube.com/embed/${item.data}` }} style={styles.videoContainer} />
      }
      return null

    default:
      return null
  }
}
