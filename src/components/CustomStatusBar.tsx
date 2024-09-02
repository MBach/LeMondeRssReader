import { useContext, useEffect, useState } from 'react'
import { StatusBar, StatusBarStyle, useColorScheme } from 'react-native'
import { SettingsContext } from '../context/SettingsContext'
import { Theme } from '../types'

interface CustomStatusBarProps {
  translucent?: boolean
}

export const CustomStatusBar = ({ translucent = false }: CustomStatusBarProps) => {
  const colorScheme = useColorScheme()
  const settingsContext = useContext(SettingsContext)
  const [barStyle, setBarStyle] = useState<StatusBarStyle>('dark-content')

  useEffect(() => {
    if (settingsContext.theme === Theme.SYSTEM) {
      setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content')
    } else {
      setBarStyle(settingsContext.theme === Theme.DARK ? 'light-content' : 'dark-content')
    }
  }, [settingsContext.theme])

  return <StatusBar translucent={translucent} barStyle={barStyle} />
}
