import React, { createContext, FC } from 'react'
import useSettings, { UseSettingsType, initialSettingsContext } from './useSettings'

export const SettingsContext = createContext<UseSettingsType>(initialSettingsContext)

const SettingsProvider: FC = ({ children }) => {
  const settingsContext = useSettings()
  return <SettingsContext.Provider value={settingsContext}>{children}</SettingsContext.Provider>
}

export default SettingsProvider
