import React, { useEffect, useState } from 'react'
import { Linking } from 'react-native'

import SettingsProvider from './context/SettingsContext'
import { setI18nConfig } from './locales/i18n'
import AppContainer from './navigation/AppContainer'

export default function App() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    await setI18nConfig()
    const u = await Linking.getInitialURL()
    setUrl(u)
  }

  return (
    <SettingsProvider>
      <AppContainer url={url} />
    </SettingsProvider>
  )
}
