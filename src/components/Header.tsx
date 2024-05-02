import React, { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, Image, Share, StyleSheet, View, StatusBar } from 'react-native'
import { useTheme, IconButton, Portal, Snackbar, Text } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { Header, LargeHeader, ScalingView } from '@codeherence/react-native-header'

import { DefaultImageFeed } from '../assets'
import { SettingsContext } from '../context/SettingsContext'
import i18n from '../locales/i18n'
import { ArticleHeader } from '../types'
import { HomeStackNavigation, HomeStackParamList } from '../navigation/AppContainer'

const useFavoriteStatus = (article: ArticleHeader) => {
  const settingsContext = useContext(SettingsContext)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (article) {
      settingsContext.hasFavorite(article.url).then(setIsFavorite)
    }
  }, [article])

  const toggleFavorite = async () => {
    if (!article) return
    const newStatus = !isFavorite
    setIsFavorite(newStatus)
    await settingsContext.toggleFavorite(article)
    return newStatus
  }

  return [isFavorite, toggleFavorite]
}

const ShareButton = ({ article }) => {
  const shareContent = async () => {
    if (!article) return
    try {
      await Share.share({ title: `Lemonde.fr : ${article.title}`, message: article.url })
    } catch (error) {}
  }

  return article && <IconButton icon="share-variant" size={20} onPress={shareContent} />
}

const FavoriteButton = ({ isFavorite, toggleFavorite, setSnackbarVisible }) => {
  const { colors } = useTheme()

  const handlePress = async () => {
    await toggleFavorite()
    setSnackbarVisible(true)
  }

  return (
    <IconButton
      animated
      icon={isFavorite ? 'star' : 'star-outline'}
      size={20}
      iconColor={isFavorite ? colors.primary : colors.onSurface}
      onPress={handlePress}
    />
  )
}

const SnackbarComponent = ({ visible, onDismiss, isFavorite }) => (
  <Portal>
    <Snackbar visible={visible} onDismiss={onDismiss} duration={Snackbar.DURATION_SHORT}>
      {isFavorite ? i18n.t('article.favAdded') : i18n.t('article.favRemoved')}
    </Snackbar>
  </Portal>
)

const BannerImage = ({ article, scrollY }) => {
  const { width } = useWindowDimensions()
  const bannerTranslationStyle = useAnimatedStyle(() => {
    const bannerTranslation = interpolate(
      scrollY.value,
      [0, article?.imgRatio ? width * article.imgRatio : 200],
      [0, article?.imgRatio ? -width * article.imgRatio : -200],
      Extrapolation.CLAMP
    )
    return { transform: [{ translateY: bannerTranslation }] }
  })

  return (
    article?.imgUrl && (
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: StatusBar.currentHeight ? -StatusBar.currentHeight : 0,
            bottom: 0
          },
          bannerTranslationStyle
        ]}>
        <Image
          source={{ uri: article.imgUrl }}
          style={{
            width,
            height: article.imgRatio ? width * article.imgRatio : 200,
            resizeMode: 'cover'
          }}
        />
      </Animated.View>
    )
  )
}

export const HeaderComponent = ({ showNavBar, scrollY, article }) => {
  const [isFavorite, toggleFavorite] = useFavoriteStatus(article)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const navigation = useNavigation<HomeStackNavigation>()

  return (
    <View style={{ position: 'relative' }}>
      <BannerImage article={article} scrollY={scrollY} />
      <Header
        ignoreTopSafeArea
        noBottomBorder
        showNavBar={showNavBar}
        headerLeft={
          <IconButton
            icon="arrow-left"
            size={20}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
          />
        }
        headerLeftFadesIn
        headerCenter={<Text numberOfLines={2}>{article?.title}</Text>}
        headerLeftStyle={{ flex: 1, flexGrow: 1 }}
        headerCenterStyle={{ flex: 1, flexGrow: 3 }}
        headerRightStyle={{ flex: 1, flexGrow: 1, minWidth: 60 }}
        headerRight={
          <>
            <ShareButton article={article} />
            <FavoriteButton isFavorite={isFavorite} toggleFavorite={toggleFavorite} setSnackbarVisible={setSnackbarVisible} />
          </>
        }
        headerRightFadesIn
      />
      <SnackbarComponent visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} isFavorite={isFavorite} />
    </View>
  )
}

export const LargeHeaderComponent = ({ scrollY, article }) => (
  <LargeHeader headerStyle={{ paddingHorizontal: 0, marginTop: 140 }}>
    <ScalingView scrollY={scrollY}>
      <Text variant="headlineSmall" style={{ paddingHorizontal: 8 }}>
        {article.title}
      </Text>
    </ScalingView>
  </LargeHeader>
)

export default function CustomHeader({ article, loading }) {
  const [isFavorite, toggleFavorite] = useFavoriteStatus(article)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const navigation = useNavigation<HomeStackNavigation>()
  const window = useWindowDimensions()
  const styles = StyleSheet.create({
    imageHeader: {
      width: window.width,
      height: 200,
      resizeMode: 'contain'
    }
  })

  return (
    <View style={{ flexDirection: 'row', height: article?.imgRatio ? window.width * article.imgRatio : 200 }}>
      {article && article.imgUrl ? (
        <View style={{ position: 'absolute' }}>
          <Image
            source={{ uri: article.imgUrl }}
            style={{
              width: window.width,
              height: article.imgRatio ? window.width * article.imgRatio : 200,
              resizeMode: 'cover'
            }}
          />
        </View>
      ) : (
        <Image source={DefaultImageFeed} style={{ position: 'absolute', ...styles.imageHeader }} />
      )}
      <IconButton icon="arrow-left" size={20} onPress={() => navigation.navigate('Home')} />
      <View style={{ flexGrow: 1 }} />
      {!loading && <FavoriteButton isFavorite={isFavorite} setSnackbarVisible={setSnackbarVisible} toggleFavorite={toggleFavorite} />}
      {!loading && <ShareButton article={article} />}
      <SnackbarComponent visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} isFavorite={isFavorite} />
    </View>
  )
}
