import React, { useEffect } from 'react'
import { YellowBox } from 'react-native'

import SettingsProvider from './context/SettingsContext'
import { loadLocale } from './locales/i18n'
import AppContainer from './navigation/AppContainer'

const uriPrefix = 'lemonde://lemonde'

YellowBox.ignoreWarnings(['[xmldom warning]'])

const App = () => {
  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    await loadLocale()
  }

  return (
    <SettingsProvider>
      <AppContainer uriPrefix={uriPrefix} />
    </SettingsProvider>
  )
}

export default App
