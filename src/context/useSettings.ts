import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import { Theme } from 'react-native-paper/lib/typescript/types'

import { darkTheme, lightTheme } from '../styles'
import DynamicNavbar from '../DynamicNavbar'
import { Category } from '../types'

import defaultFeeds from '../feeds.json'

export interface UseSettingsType {
  hydrated: boolean
  theme: Theme
  feed: Category[]
  fontScale: number
  doc: HTMLElement | null
  toggleFavorite: (item: string) => Promise<void>
  hasFavorite: (link: string) => Promise<boolean>
  getFavorites: () => Promise<string[]>
  setTheme: (theme: string) => Promise<void>
  setShare: (uri: string) => Promise<void>
  getShare: () => Promise<string | null>
  getTheme: () => Promise<string | null>
  setFeed: (feed: Category[]) => Promise<void>
  getFeed: () => Promise<Category[]>
  setDoc: (d: HTMLElement | null) => void
}

// Default values
export const initialSettingsContext = {
  hydrated: false,
  fontScale: 1,
  feed: defaultFeeds,
  doc: null
} as UseSettingsType

const useSettings = (): UseSettingsType => {
  const [hydrated, setHydrated] = useState<boolean>(false)
  const [fontScale, setFontScale] = useState<number>(1)
  const [theme, _setTheme] = useState<any>(null)
  const [feed, _setFeed] = useState<Category[]>(defaultFeeds)
  const [doc, setDoc] = useState<HTMLElement | null>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    setFontScale(await DeviceInfo.getFontScale())
    const t = await getTheme()
    const isDark = t === null || t === 'dark'
    _setTheme(isDark ? darkTheme : lightTheme)
    DynamicNavbar.setLightNavigationBar(!isDark)
    _setFeed(await getFeed())
    setHydrated(true)
  }

  const toggleFavorite = async (item) => {
    let favorites = await getFavorites()
    const index = favorites.findIndex((f) => f.link === item.link)
    if (index === -1) {
      favorites.push(item)
    } else {
      favorites.splice(index, 1)
    }
    await AsyncStorage.setItem('favorites', JSON.stringify(favorites))
  }

  const hasFavorite = async (link: string) => {
    let favorites = await AsyncStorage.getItem('favorites')
    if (favorites) {
      let fav = JSON.parse(favorites)
      for (const f of fav) {
        if (f.link === link) {
          return true
        }
      }
      return false
    } else {
      return false
    }
  }

  const getFavorites = async () => {
    let favorites = await AsyncStorage.getItem('favorites')
    if (favorites) {
      return JSON.parse(favorites)
    } else {
      return []
    }
  }

  const setShare = async (shared: string) => {
    const isShared = shared ? '1' : '0'
    await AsyncStorage.setItem('share', isShared)
  }

  const getShare = async () => await AsyncStorage.getItem('share')

  const setTheme = async (theme: string) => {
    const isDark = theme === 'dark'
    _setTheme(isDark ? darkTheme : lightTheme)
    DynamicNavbar.setLightNavigationBar(!isDark)
    await AsyncStorage.setItem('theme', theme)
  }

  const getTheme = async () => await AsyncStorage.getItem('theme')

  const setFeed = async (feed: Category[]) => {
    _setFeed(feed)
    await AsyncStorage.setItem('feed', JSON.stringify(feed))
  }

  const getFeed = async () => {
    const feed = await AsyncStorage.getItem('feed')
    return feed ? JSON.parse(feed) : defaultFeeds
  }

  return {
    hydrated,
    theme,
    feed,
    fontScale,
    doc,
    toggleFavorite,
    hasFavorite,
    getFavorites,
    setTheme,
    setShare,
    getShare,
    getTheme,
    setFeed,
    getFeed,
    setDoc
  }
}

export default useSettings
