import { FadingView, Header, LargeHeader, ScalingView } from '@codeherence/react-native-header'
import { useRouter } from 'expo-router'
import { type FC, useContext, useEffect, useState } from 'react'
import { Image, Share, View, useWindowDimensions } from 'react-native'
import { IconButton, Portal, Snackbar, Text, useTheme } from 'react-native-paper'
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated'

import { i18n } from '../../src/locales/i18n'
import { ArticleHeader } from '../../src/types'
import { SettingsContext } from '../context/SettingsContext'

const useFavoriteStatus = (article: ArticleHeader): [boolean, () => Promise<boolean>] => {
  const settingsContext = useContext(SettingsContext)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (article) {
      settingsContext.hasFavorite(article.url).then((v) => {
        setIsFavorite(v)
      })
    }
  }, [article])

  const toggleFavorite = async (): Promise<boolean> => {
    const newStatus = !isFavorite
    setIsFavorite(newStatus)
    await settingsContext.toggleFavorite(article)
    return newStatus
  }

  return [isFavorite, toggleFavorite]
}

type ShareButtonProps = { article: ArticleHeader }
const ShareButton: FC<ShareButtonProps> = ({ article }) => {
  const shareContent = async () => {
    if (!article) return
    try {
      await Share.share({ title: `Lemonde.fr : ${article.title}`, message: article.url })
    } catch (error) {}
  }

  return article && <IconButton icon="share-variant" size={20} onPress={shareContent} />
}

type FavoriteButtonProps = {
  isFavorite: boolean
  toggleFavorite: () => Promise<boolean>
  setSnackbarVisible: (value: boolean) => void
  setLastAction: (added: boolean) => void
}
const FavoriteButton: FC<FavoriteButtonProps> = ({ isFavorite, toggleFavorite, setSnackbarVisible, setLastAction }) => {
  const { colors } = useTheme()

  const handlePress = async () => {
    const nowFavorite = await toggleFavorite()
    setLastAction(nowFavorite)
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

type BannerImageProps = { article: ArticleHeader; scrollY: SharedValue<number> }
const BannerImage: FC<BannerImageProps> = ({ article, scrollY }) => {
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

interface HeaderComponentProps {
  article: ArticleHeader
  showNavBar?: SharedValue<number>
  scrollY?: SharedValue<number>
  children?: React.ReactNode
}

export const HeaderComponent = ({ article, showNavBar, scrollY, children }: HeaderComponentProps) => {
  const fallbackShowNavBar = useSharedValue(0)
  const fallbackScrollY = useSharedValue(0)

  const [isFavorite, toggleFavorite] = useFavoriteStatus(article)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [lastAction, setLastAction] = useState(false)
  const router = useRouter()
  const settingsContext = useContext(SettingsContext)

  const _showNavBar = showNavBar ?? fallbackShowNavBar
  const _scrollY = scrollY ?? fallbackScrollY
  const opacity = useDerivedValue(() => 1 - _showNavBar.value)

  return (
    <View style={{ flex: children ? 1 : 0 }}>
      <FadingView opacity={opacity}>
        <BannerImage article={article} scrollY={_scrollY} />
      </FadingView>
      <Header
        ignoreTopSafeArea
        noBottomBorder
        showNavBar={_showNavBar}
        headerLeft={
          <IconButton
            icon="arrow-left"
            size={20}
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/(tabs)/(home)'))}
          />
        }
        headerCenter={<Text numberOfLines={2}>{article?.title}</Text>}
        headerLeftStyle={{ flex: 1, flexGrow: 1 }}
        headerCenterStyle={{ flex: 1, flexGrow: 3 }}
        headerRightStyle={{ flex: 1, flexGrow: 1, minWidth: 60 }}
        headerRight={
          <>
            {settingsContext.share && <ShareButton article={article} />}
            <FavoriteButton
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
              setSnackbarVisible={setSnackbarVisible}
              setLastAction={setLastAction}
            />
          </>
        }
        headerRightFadesIn
      />
      <Portal>
        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT}>
          {lastAction ? i18n.t('article.favAdded') : i18n.t('article.favRemoved')}
        </Snackbar>
      </Portal>
      {children}
    </View>
  )
}

export const LargeHeaderComponent: FC<BannerImageProps> = ({ article, scrollY }) => (
  <LargeHeader headerStyle={{ paddingHorizontal: 0, marginTop: 172 }}>
    <ScalingView scrollY={scrollY}>
      <Text variant="headlineSmall" style={{ paddingHorizontal: 8 }}>
        {article.title}
      </Text>
    </ScalingView>
  </LargeHeader>
)
