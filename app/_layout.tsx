import 'react-native-reanimated'

import { SettingsContext, SettingsProvider } from '@/src/context/SettingsContext'
import { BottomSheetProvider } from '@/src/context/useBottomSheet'
import { useMaterial3Theme } from '@pchmn/expo-material3-theme'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { adaptNavigationTheme, Provider as PaperProvider } from 'react-native-paper'
import { darkTheme, lightTheme } from '../src/constants'
import { Theme } from '../src/types'

const queryClient = new QueryClient()

const { LightTheme: NavLight, DarkTheme: NavDark } = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
  reactNavigationDark: DarkTheme
})

function ThemedApp() {
  const settingsContext = useContext(SettingsContext)
  const colorScheme = useColorScheme()
  const { theme } = useMaterial3Theme({ fallbackSourceColor: '#FABD00' })

  const isLight = colorScheme === 'light'

  const paperTheme = useMemo(() => {
    if (settingsContext.theme === Theme.SYSTEM) {
      return isLight ? { ...lightTheme, colors: theme.light } : { ...darkTheme, colors: theme.dark }
    }
    return settingsContext.theme === Theme.LIGHT ? lightTheme : darkTheme
  }, [settingsContext.theme, isLight, theme])

  const navigationTheme = useMemo(() => {
    if (settingsContext.theme === Theme.SYSTEM) return isLight ? NavLight : NavDark
    return settingsContext.theme === Theme.LIGHT ? NavLight : NavDark
  }, [settingsContext.theme, isLight])

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </PaperProvider>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetProvider>
            <ThemedApp />
          </BottomSheetProvider>
        </GestureHandlerRootView>
      </SettingsProvider>
    </QueryClientProvider>
  )
}
