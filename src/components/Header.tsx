import React, { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, Image, Share, View } from 'react-native'
import { useTheme, IconButton, Portal, Snackbar, Text } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { FadingView, Header, LargeHeader, ScalingView } from '@codeherence/react-native-header'

import { SettingsContext } from '../context/SettingsContext'
import i18n from '../locales/i18n'
import { ArticleHeader, MainStackNavigation } from '../types'

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

const BannerImage = ({ article, scrollY }: { article: ArticleHeader; scrollY: Animated.SharedValue<number> }) => {
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
            top: 0,
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

export const HeaderComponent = ({
  showNavBar,
  scrollY,
  article
}: {
  showNavBar: Animated.SharedValue<number>
  scrollY: Animated.SharedValue<number>
  article: ArticleHeader
}) => {
  const [isFavorite, toggleFavorite] = useFavoriteStatus(article)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const navigation = useNavigation<MainStackNavigation>()
  const opacity = useDerivedValue(() => 1 - showNavBar.value)

  return (
    <View style={{ position: 'relative' }}>
      <FadingView opacity={opacity}>
        <BannerImage article={article} scrollY={scrollY} />
      </FadingView>
      <Header
        //ignoreTopSafeArea
        noBottomBorder
        showNavBar={showNavBar}
        headerLeft={
          <IconButton
            icon="arrow-left"
            size={20}
            onPress={() => {
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')
            }}
          />
        }
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
      <Portal>
        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT}>
          {isFavorite ? i18n.t('article.favAdded') : i18n.t('article.favRemoved')}
        </Snackbar>
      </Portal>
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
