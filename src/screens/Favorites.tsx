import React, { useCallback, useContext, useEffect, useState } from 'react'
import { FlatList, StatusBar, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { ActivityIndicator, Appbar, IconButton, List, Snackbar, Surface, Text } from 'react-native-paper'

import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'
import { ArticleHeader, parseAndGuessURL } from '../types'
import { HomeStackNavigation } from '../navigation/AppContainer'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export default function FavScreen() {
  const settingsContext = useContext(SettingsContext)
  const [loading, setLoading] = useState(true)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [favorites, setFavorites] = useState<ArticleHeader[]>([])
  const navigation = useNavigation<HomeStackNavigation>()

  useEffect(() => {
    getFavorites()
  }, [])

  useFocusEffect(
    useCallback(() => {
      getFavorites()
    }, [])
  )

  const getFavorites = async () => {
    setLoading(true)
    setFavorites(await settingsContext.getFavorites())
    setLoading(false)
  }

  /**
   * Render a single favorite in the FlatList.
   */
  const renderFavorite = ({ item }: { item: ArticleHeader }) => (
    <List.Item
      title={item.title}
      titleNumberOfLines={3}
      description={item.category}
      onPress={() => {
        const parsed = parseAndGuessURL(item.url)
        if (parsed) {
          navigation.navigate(parsed.type, parsed)
        }
      }}
      right={() => (
        <IconButton
          icon="delete"
          size={22}
          onPress={async () => {
            await settingsContext.toggleFavorite(item)
            getFavorites()
          }}
        />
      )}
    />
  )

  return (
    <Surface style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={navigation.goBack} />
        <Appbar.Content title={i18n.t('drawer.fav')} />
      </Appbar.Header>
      {loading ? (
        <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignContent: 'center', height: '100%' }} />
      ) : favorites.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <List.Icon icon="star-off" />
          <Text variant="titleMedium">{i18n.t('favorites.empty')}</Text>
        </View>
      ) : (
        <FlatList
          style={{ paddingTop: StatusBar.currentHeight }}
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item: ArticleHeader) => item.url}
        />
      )}
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT}>
        {i18n.t('favorites.deleted')}
      </Snackbar>
    </Surface>
  )
}
