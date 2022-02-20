import React, { useCallback, useContext, useEffect, useState } from 'react'
import { FlatList, StatusBar, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useTheme, ActivityIndicator, Snackbar, Subheading, Surface, List, IconButton } from 'react-native-paper'
import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export default function FavScreen() {
  const { colors } = useTheme()
  const settingsContext = useContext(SettingsContext)
  const [loading, setLoading] = useState(true)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const navigation = useNavigation()

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
  const renderFavorite = ({ item }) => {
    return (
      <List.Item
        title={item.title}
        titleNumberOfLines={3}
        description={item.category}
        onPress={() => navigation.navigate('BottomTabsNavigator', { item })}
        right={() => (
          <View style={{ justifyContent: 'center' }}>
            <IconButton
              icon="delete"
              size={22}
              onPress={async () => {
                await settingsContext.toggleFavorite(item)
                getFavorites()
              }}
            />
          </View>
        )}
      />
    )
  }

  return (
    <Surface style={{ flex: 1, paddingHorizontal: 8, paddingTop: 8 }}>
      {loading ? (
        <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignContent: 'center', height: '100%' }} />
      ) : favorites.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <List.Icon icon="star-off" color={colors.divider} />
          <Subheading style={{ color: colors.divider }}>{i18n.t('favorites.empty')}</Subheading>
        </View>
      ) : (
        <>
          <FlatList
            style={{ paddingTop: StatusBar.currentHeight }}
            data={favorites}
            renderItem={renderFavorite}
            keyExtractor={(item, index) => index.toString()}
          />
          <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT}>
            {i18n.t('favorites.deleted')}
          </Snackbar>
        </>
      )}
    </Surface>
  )
}
