import React, { useContext, useEffect, useState } from 'react'
import { FlatList, StatusBar, StyleSheet, View } from 'react-native'
import {
  useTheme,
  ActivityIndicator,
  Caption,
  Paragraph,
  Snackbar,
  Subheading,
  Surface,
  List,
  TouchableRipple,
  IconButton,
} from 'react-native-paper'
import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function FavScreen({ navigation }) {
  const { colors } = useTheme()
  const { settingsContext } = useContext(SettingsContext)
  const [loading, setLoading] = useState(true)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    getFavorites()
  }, [])

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
        description={item.description}
        descriptionNumberOfLines={3}
        onPress={() => navigation.navigate('BottomTabsNavigator', { item })}
        right={() => (
          <View style={{ justifyContent: 'center' }}>
            <IconButton icon="delete" size={22} onPress={() => settingsContext.toggleFavorite(item.link)} />
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
          <Subheading style={{ color: colors.divider }}>Aucun favori</Subheading>
        </View>
      ) : (
        <>
          <FlatList
            style={{ paddingTop: StatusBar.currentHeight }}
            data={favorites}
            renderItem={renderFavorite}
            keyExtractor={(item, index) => index.toString()}
            ListFooterComponent={<View style={{ marginBottom: 40 }} />}
          />
          <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={Snackbar.DURATION_SHORT}>
            Favori supprimé
          </Snackbar>
        </>
      )}
    </Surface>
  )
}
