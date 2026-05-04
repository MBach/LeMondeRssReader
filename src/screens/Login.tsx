import { useRouter } from 'expo-router'
import { useContext, useRef } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Appbar } from 'react-native-paper'
import WebView, { WebViewNavigation } from 'react-native-webview'

import { SettingsContext } from '../context/SettingsContext'
import { i18n } from '../locales/i18n'

const LOGIN_URL = 'https://secure.lemonde.fr/sfuser/connexion'
const LOGOUT_URL = 'https://secure.lemonde.fr/sfuser/deconnexion'

interface Props {
  mode: 'login' | 'logout'
}

export function LoginScreen({ mode }: Props) {
  const router = useRouter()
  const settingsContext = useContext(SettingsContext)
  const doneRef = useRef(false)

  const onLoginNavChange = async (state: WebViewNavigation) => {
    if (doneRef.current || !state.url || state.url === 'about:blank') return
    if (state.url.startsWith('https://www.lemonde.fr')) {
      doneRef.current = true
      await settingsContext.setLoggedIn(true)
      router.back()
    }
  }

  const onLogoutLoadEnd = async () => {
    if (doneRef.current) return
    doneRef.current = true
    await settingsContext.setLoggedIn(false)
    router.back()
  }

  if (mode === 'logout') {
    return (
      <View style={StyleSheet.absoluteFill}>
        <ActivityIndicator style={StyleSheet.absoluteFill} size="large" />
        <WebView
          source={{ uri: LOGOUT_URL }}
          style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
          onLoadEnd={onLogoutLoadEnd}
        />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={i18n.t('settings.account.loginTitle')} />
      </Appbar.Header>
      <WebView
        source={{ uri: LOGIN_URL }}
        onNavigationStateChange={onLoginNavChange}
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
      />
    </View>
  )
}
