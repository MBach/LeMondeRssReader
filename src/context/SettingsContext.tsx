import React, { createContext, type FC, type ReactNode } from 'react'
import { initialSettingsContext, useSettings, UseSettingsType } from './useSettings'

export const SettingsContext = createContext<UseSettingsType>(initialSettingsContext)

export const SettingsProvider: FC<{
  children: ReactNode
}> = ({ children }) => {
  const settingsContext = useSettings()
  return <SettingsContext.Provider value={settingsContext}>{children}</SettingsContext.Provider>
}
