import { useFocusEffect } from 'expo-router'
import { useRouter } from 'expo-router'
import { useCallback, useContext, useState } from 'react'
import { FlatList, View } from 'react-native'
import { ActivityIndicator, IconButton, List, Snackbar, Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SettingsContext } from '@/src/context/SettingsContext'
import { useBottomSheet } from '@/src/context/useBottomSheet'
import { i18n } from '@/src/locales/i18n'
import { ArticleHeader, ArticleType, parseAndGuessURL } from '@/src/types'

export default function FavoritesScreen() {
  const settingsContext = useContext(SettingsContext)
  const router = useRouter()
  const sheetRef = useBottomSheet()

  const [loading, setLoading] = useState(true)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [favorites, setFavorites] = useState<ArticleHeader[]>([])

  useFocusEffect(
    useCallback(() => {
      loadFavorites()
    }, [])
  )

  const loadFavorites = async () => {
    setLoading(true)
    setFavorites(await settingsContext.getFavorites())
    setLoading(false)
  }

  const navigateTo = (item: ArticleHeader) => {
    const parsed = parseAndGuessURL(item.url)
    if (!parsed) return
    sheetRef?.current?.close()
    const { category, yyyy, mm, dd, title, type } = parsed
    switch (type) {
      case ArticleType.ARTICLE:
        router.push(`/(tabs)/(home)/${category}/article/${yyyy}/${mm}/${dd}/${title}`)
        break
      case ArticleType.LIVE:
        router.push(`/(tabs)/(home)/${category}/live/${yyyy}/${mm}/${dd}/${title}`)
        break
      case ArticleType.VIDEO:
        router.push(`/(tabs)/(home)/${category}/video/${yyyy}/${mm}/${dd}/${title}`)
        break
      case ArticleType.PODCAST:
        router.push(`/(tabs)/(home)/${category}/podcast/${yyyy}/${mm}/${dd}/${title}`)
        break
    }
  }

  const renderFavorite = ({ item }: { item: ArticleHeader }) => (
    <List.Item
      title={item.title}
      titleNumberOfLines={3}
      description={item.category}
      onPress={() => navigateTo(item)}
      right={() => (
        <IconButton
          icon="delete"
          size={22}
          onPress={async () => {
            await settingsContext.toggleFavorite(item)
            setSnackbarVisible(true)
            loadFavorites()
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
