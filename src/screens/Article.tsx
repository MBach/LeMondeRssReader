import Icon from '@expo/vector-icons/MaterialCommunityIcons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Image, Linking, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Button, Card, IconButton, Surface, Text, useTheme } from 'react-native-paper'
import Carousel from 'react-native-reanimated-carousel'
import WebView from 'react-native-webview'

import { FlatListWithHeaders } from '@codeherence/react-native-header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconPremium } from '../../assets'
import CustomStatusBar from '../components/CustomStatusBar'
import { FetchError } from '../components/FetchError'
import { HeaderComponent, LargeHeaderComponent } from '../components/Header'
import { SettingsContext } from '../context/SettingsContext'
import { useWebViewFetch } from '../hooks/useWebViewFetch'
import { i18n } from '../locales/i18n'
import { ArticleHeader, ArticleType, CarouselCard, ContentType, MenuEntry, SeeAlsoButtonContent, parseAndGuessURL } from '../types'
import { parseArticleHtml } from '../utils/articleParser'

export default function ArticleScreen() {
  const router = useRouter()
  const { category, slug } = useLocalSearchParams<{ category: string; slug: string[] }>()
  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()
  const window = useWindowDimensions()

  const [yyyy, mm, dd, title] = Array.isArray(slug) ? slug : []

  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [paragraphes, setParagraphes] = useState<ContentType[]>([])
  const [openCarousel, setOpenCarousel] = useState(false)

  const { fetch, reset, html, status, webViewProps } = useWebViewFetch()

  const articleUrl =
    category && yyyy && mm && dd && title ? `https://www.lemonde.fr/${category}/article/${yyyy}/${mm}/${dd}/${title}` : null

  const styles = StyleSheet.create({
    subtitle: { paddingHorizontal: 8, marginTop: 8 },
    paragraph: { paddingHorizontal: 8, marginTop: 8 },
    imgCaption: {
      position: 'absolute',
      bottom: -2,
      padding: 4,
      backgroundColor: 'rgba(0,0,0,0.5)'
    },
    card: { margin: 8, backgroundColor: colors.elevation.level2 },
    footerPadding: { paddingBottom: 40 },
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

  useEffect(() => {
    if (!articleUrl) {
      console.log('[ArticleScreen] params not ready:', { category, slug })
      return
    }
    reset()
    console.log('[ArticleScreen] fetching:', articleUrl)
    fetch(articleUrl)
  }, [articleUrl])

  useEffect(() => {
    if (status !== 'done' || !html) return
    try {
      const { article: a, paragraphes: p } = parseArticleHtml(html, window.width, settingsContext.hasReadAlso)
      setArticle(a)
      setParagraphes(p)
    } catch (e) {
      console.warn('[ArticleScreen] parse error', e)
    }
  }, [status, html])

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

  const renderHeader = () =>
    article ? (
      <View>
        {article.imgUrl && (
          <Image
            source={{ uri: article.imgUrl }}
            style={{
              width: window.width,
              height: article.imgRatio ? window.width * article.imgRatio : window.width / 2
            }}
          />
        )}
        <Text variant="headlineSmall" style={{ padding: 8 }}>
          {article.title}
        </Text>
      </View>
    ) : null

  const renderItem = ({ item }: { item: ContentType }) => {
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

  const renderFooter = () => (
    <>
      {article?.isRestricted && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium">{i18n.t('article.restricted')}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => Linking.openURL('https://abo.lemonde.fr/')}>
              {i18n.t('article.register')}
            </Button>
          </Card.Actions>
        </Card>
      )}
      <View style={styles.footerPadding} />
    </>
  )

  const isLoading = status === 'idle' || status === 'loading' || !article
  const fetchFailed = status === 'error'
  const dynamicColor = settingsContext.hasDynamicStatusBarColor && article?.isRestricted
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dynamicColor ? colors.primaryContainer : 'transparent', marginBottom: -48 }}>
      {fetchFailed ? (
        <FetchError
          onRetry={() => {
            reset()
            if (articleUrl) fetch(articleUrl)
          }}
        />
      ) : isLoading ? (
        <ActivityIndicator
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
          color={colors.primary}
          size={40}
        />
      ) : (
        <Surface style={{ flex: 1 }}>
          <CustomStatusBar translucent={!dynamicColor} />
          <FlatListWithHeaders
            disableAutoFixScroll
            headerFadeInThreshold={0.8}
            disableLargeHeaderFadeAnim={false}
            data={paragraphes}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            HeaderComponent={(props) => <HeaderComponent {...props} article={article} />}
            LargeHeaderComponent={(props) => <LargeHeaderComponent {...props} article={article} />}
            ListFooterComponent={renderFooter()}
          />
        </Surface>
      )}
      {/* Render outside layout flow so mount/unmount never shifts siblings */}
      {webViewProps && <WebView {...webViewProps} />}
    </SafeAreaView>
  )
}
