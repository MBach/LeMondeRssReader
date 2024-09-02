import { createContext, type FC, type ReactNode } from 'react'
import { useSettings, UseSettingsType, initialSettingsContext } from './useSettings'

export const SettingsContext = createContext<UseSettingsType>(initialSettingsContext)

export const SettingsProvider: FC<{
  children: ReactNode
}> = ({ children }) => {
  const settingsContext = useSettings()
  return <SettingsContext.Provider value={settingsContext}>{children}</SettingsContext.Provider>
}
