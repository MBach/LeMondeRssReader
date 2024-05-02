import React, { useEffect } from 'react'

import SettingsProvider from './context/SettingsContext'
import { setI18nConfig } from './locales/i18n'
import AppContainer from './navigation/AppContainer'

export default function App() {
  useEffect(() => {
    init()
  }, [])

  const init = async () => await setI18nConfig()

  return (
    <SettingsProvider>
      <AppContainer />
    </SettingsProvider>
  )
}
