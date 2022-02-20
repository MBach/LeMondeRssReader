import React, { useContext, useEffect, useState } from 'react'
import { useWindowDimensions, Image, Share, StyleSheet, View } from 'react-native'
import { useTheme, IconButton, Portal, Snackbar } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'

import { DefaultImageFeed } from '../assets/Icons'
import { SettingsContext } from '../context/SettingsContext'
import i18n from '../locales/i18n'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.1
 */
export default function Header({ data, item, loading }) {
  const { colors } = useTheme()
  const settingsContext = useContext(SettingsContext)
  const [isFavorite, setIsFavorite] = useState<boolean>(false)
  const [shared, setShared] = useState<boolean>(false)
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
    settingsContext.getShare().then((s) => {
      setShared(s === null || s === '1')
    })
  }, [])

  useEffect(() => {
    if (!loading) {
      settingsContext.hasFavorite(data.link).then((isFav) => {
        setIsFavorite(isFav)
      })
    }
  }, [loading])

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

  return (
    <View style={{ flexDirection: 'row', height: 200 }}>
      {item && item.uri ? (
        <View style={{ position: 'absolute' }}>
          <Image source={{ uri: item.uri }} style={styles.imageHeader} />
        </View>
      ) : (
        <Image source={data.imgUri ? { uri: data.imgUri } : DefaultImageFeed} style={{ position: 'absolute', ...styles.imageHeader }} />
      )}
      <IconButton icon="arrow-left" size={20} onPress={() => navigation.navigate('Home')} />
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
