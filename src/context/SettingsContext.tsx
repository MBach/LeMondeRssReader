import React, { createContext, FC, ReactNode } from 'react'
import useSettings, { UseSettingsType, initialSettingsContext } from './useSettings'

export const SettingsContext = createContext<UseSettingsType>(initialSettingsContext)

interface Props {
  children: ReactNode
}

const SettingsProvider: FC<Props> = ({ children }) => {
  const settingsContext = useSettings()
  return <SettingsContext.Provider value={settingsContext}>{children}</SettingsContext.Provider>
}

export default SettingsProvider
