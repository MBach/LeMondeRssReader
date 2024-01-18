import React, { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, Image, Share, StyleSheet, View } from 'react-native'
import { useTheme, IconButton, Portal, Snackbar } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'

import { DefaultImageFeed } from '../assets'
import { SettingsContext } from '../context/SettingsContext'
import i18n from '../locales/i18n'
import { ExtentedRssItem } from '../types'

type Props = {
  article: ExtentedRssItem
  loading: boolean
}

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.1
 */
export default function Header({ article, loading }: Props) {
  const { colors } = useTheme()
  const settingsContext = useContext(SettingsContext)
  const [isFavorite, setIsFavorite] = useState<boolean>(false)
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false)
  const navigation = useNavigation()
  const window = useWindowDimensions()
  const styles = StyleSheet.create({
    imageHeader: {
      width: window.width,
      height: 200,
      resizeMode: 'contain'
    }
  })

  useEffect(() => {
    if (!loading) {
      settingsContext.hasFavorite(article.link).then((isFav: boolean) => {
        setIsFavorite(isFav)
      })
    }
  }, [loading])

  const shareContent = async () => {
    try {
      await Share.share({ title: `Lemonde.fr : ${article.title}`, message: article.link })
    } catch (error) {
      // nothing
    }
  }

  const toggleFavorite = async () => {
    setIsFavorite(!isFavorite)
    await settingsContext.toggleFavorite(article)
    setSnackbarVisible(true)
  }

  return (
    <View style={{ flexDirection: 'row', height: 200 }}>
      {article && article.uri ? (
        <View style={{ position: 'absolute' }}>
          <Image source={{ uri: article.uri }} style={styles.imageHeader} />
        </View>
      ) : (
        <Image
          source={article.imgUri ? { uri: article.imgUri } : DefaultImageFeed}
          style={{ position: 'absolute', ...styles.imageHeader }}
        />
      )}
      <IconButton icon="arrow-left" size={20} onPress={() => navigation.navigate('Home')} />
      <View style={{ flexGrow: 1 }} />
      {!loading && settingsContext.share && <IconButton icon="share-variant" size={20} onPress={shareContent} />}
      {!loading && (
        <IconButton
          animated
          icon={isFavorite ? 'star' : 'star-outline'}
          size={20}
          iconColor={isFavorite ? colors.primary : colors.onPrimary}
          onPress={toggleFavorite}
        />
      )}
      {snackbarVisible && (
        <Portal>
          <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT}>
            {isFavorite ? i18n.t('article.favAdded') : i18n.t('article.favRemoved')}
          </Snackbar>
        </Portal>
      )}
    </View>
  )
}
