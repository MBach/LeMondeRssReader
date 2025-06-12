import { useContext } from 'react'
import { Appearance, SafeAreaView } from 'react-native'
import { DefaultTheme, type LinkingOptions, NavigationContainer } from '@react-navigation/native'
import { adaptNavigationTheme, Provider } from 'react-native-paper'
import { useMaterial3Theme } from '@pchmn/expo-material3-theme'

import { SettingsContext } from '../context/SettingsContext'
import { BottomSheetProvider } from '../context/useBottomSheet'
import { darkTheme, lightTheme } from '../constants'
import { RootStack } from './RootStack'
import { RootStackParamList, Theme } from '../types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://www.lemonde.fr'],
  config: {
    screens: {
      MainStack: {
        screens: {
          Home: 'home',
          Article: ':category/article/:yyyy/:mm/:dd/:title',
          Live: ':category/live/:yyyy/:mm/:dd/:title',
          Podcast: 'podcast',
          Video: ':category/video/:yyyy/:mm/:dd/:title'
        }
      },
      Favorites: 'favorites',
      Settings: 'settings'
    }
  }
}

const queryClient = new QueryClient()

export function AppContainer() {
  const { LightTheme, DarkTheme } = adaptNavigationTheme({ reactNavigationLight: DefaultTheme, reactNavigationDark: DefaultTheme })
  const settingsContext = useContext(SettingsContext)
  const { theme } = useMaterial3Theme({ fallbackSourceColor: '#FABD00' })

  const isLight = Appearance.getColorScheme() === 'light'
  const paperTheme =
    settingsContext.theme === Theme.SYSTEM
      ? isLight
        ? { ...lightTheme, colors: theme.light }
        : { ...darkTheme, colors: theme.dark }
      : settingsContext.theme === Theme.LIGHT
        ? lightTheme
        : darkTheme

  const navigationContainerTheme =
    settingsContext.theme === Theme.SYSTEM
      ? isLight
        ? LightTheme
        : DarkTheme
      : settingsContext.theme === Theme.LIGHT
        ? LightTheme
        : DarkTheme

  return (
    <QueryClientProvider client={queryClient}>
      <Provider theme={paperTheme}>
        <SafeAreaView style={{ flex: 1 }}>
          <NavigationContainer linking={linking} theme={navigationContainerTheme}>
            <BottomSheetProvider>
              <RootStack />
            </BottomSheetProvider>
          </NavigationContainer>
        </SafeAreaView>
      </Provider>
    </QueryClientProvider>
  )
}
