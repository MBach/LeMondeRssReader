import { useEffect } from 'react'

import { SettingsProvider } from './context/SettingsContext'
import { setI18nConfig } from './locales/i18n'
import { AppContainer } from './navigation/AppContainer'

async function init() {
  try {
    await setI18nConfig()
  } catch (error) {
    console.error('Failed to initialize i18n:', error)
  }
}

export default function App() {
  useEffect(() => {
    init()
  }, [])

  return (
    <SettingsProvider>
      <AppContainer />
    </SettingsProvider>
  )
}
