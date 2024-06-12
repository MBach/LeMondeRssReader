import React, { useCallback, useContext, useEffect, useState } from 'react'
import { FlatList, SafeAreaView, StatusBar, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { ActivityIndicator, IconButton, List, Snackbar, Text } from 'react-native-paper'

import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'
import { ArticleHeader, MainStackNavigation, parseAndGuessURL } from '../types'
import { useBottomSheet } from '../context/useBottomSheet'

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
  const navigation = useNavigation<MainStackNavigation>()
  const sheetRef = useBottomSheet()

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
          sheetRef?.current?.close()
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
    <SafeAreaView style={{ flex: 1 }}>
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
    </SafeAreaView>
  )
}
