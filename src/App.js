import React, { useEffect, useState } from 'react'
import { Linking } from 'react-native'

import SettingsProvider from './context/SettingsContext'
import { loadLocale } from './locales/i18n'
import AppContainer from './navigation/AppContainer'

const App = () => {
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    await loadLocale()
    const u = await Linking.getInitialURL()
    setUrl(u)
    setLoading(false)
  }

  if (loading) {
    return false
  }

  return (
    <SettingsProvider>
      <AppContainer url={url} />
    </SettingsProvider>
  )
}

export default App
