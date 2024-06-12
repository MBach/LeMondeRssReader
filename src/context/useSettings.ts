import React, { useEffect, useState } from 'react'
import { Appearance } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'

import DynamicNavbar from '../DynamicNavbar'
import { ArticleHeader, Category, MenuEntry, Theme } from '../types'
import defaultFeeds from '../feeds.json'
import { KEYS } from '../constants'

export interface UseSettingsType {
  currentCategory: MenuEntry | null
  feed: Category[]
  fontScale: number
  hasDynamicStatusBarColor: boolean
  hasReadAlso: boolean
  hydrated: boolean
  keepLastSection: boolean
  keepScreenOn: boolean
  lastFiveCategories: MenuEntry[]
  share: boolean
  theme: Theme
  getFavorites: () => Promise<ArticleHeader[]>
  hasFavorite: (link: string) => Promise<boolean>
  setCurrentCategory: (c: MenuEntry) => Promise<void>
  setDynamicStatusBarColor: (b: boolean) => Promise<void>
  setFeed: (feed: Category[]) => Promise<void>
  setKeepLastSection: (b: boolean) => Promise<void>
  setKeepScreenOn: (b: boolean) => Promise<void>
  setReadAlso: (b: boolean) => Promise<void>
  setShare: (b: boolean) => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  toggleFavorite: (article: ArticleHeader) => Promise<void>
}

// Default values
export const initialSettingsContext = {
  currentCategory: null,
  hydrated: false,
  fontScale: 1,
  feed: defaultFeeds,
  share: true,
  keepLastSection: true,
  keepScreenOn: true,
  hasDynamicStatusBarColor: true
} as UseSettingsType

const defaultMenuEntry: MenuEntry = {
  cat: 'news',
  name: 'latestNews',
  uri: 'rss/une.xml'
}

const useSettings = (): UseSettingsType => {
  const [hydrated, setHydrated] = useState<boolean>(false)
  const [fontScale, setFontScale] = useState<number>(1)
  const [theme, _setTheme] = useState<Theme>(Theme.SYSTEM)
  const [feed, _setFeed] = useState<Category[]>(defaultFeeds)
  const [keepLastSection, _setKeepLastSection] = useState<boolean>(true)
  const [keepScreenOn, _setKeepScreenOn] = useState<boolean>(true)
  const [hasReadAlso, _setReadAlso] = useState<boolean>(true)
  const [hasDynamicStatusBarColor, _setDynamicStatusBarColor] = useState<boolean>(true)
  const [share, _setShare] = useState<boolean>(true)
  const [currentCategory, _setCurrentCategory] = useState<MenuEntry | null>(null)
  const [lastFiveCategories, setLastFiveCategories] = useState<MenuEntry[]>([])

  useEffect(() => {
    _init()
  }, [])

  const _init = async (): Promise<void> => {
    setFontScale(await DeviceInfo.getFontScale())
    const f = await AsyncStorage.getItem(KEYS.FEED)
    _setFeed(f ? JSON.parse(f) : defaultFeeds)
    ///
    const s = await AsyncStorage.getItem(KEYS.SHARE)
    _setShare(s === '1' || s === null)
    ///
    const d = await AsyncStorage.getItem(KEYS.DYNAMIC_STATUSBAR_COLOR)
    _setDynamicStatusBarColor(d === '1' || d === null)
    ///
    let themeStr: string | null = await AsyncStorage.getItem(KEYS.THEME)
    switch (themeStr) {
      case 'light':
        DynamicNavbar.setLightNavigationBar(true)
        _setTheme(Theme.LIGHT)
        break
      case 'dark':
        DynamicNavbar.setLightNavigationBar(false)
        _setTheme(Theme.DARK)
        break
      default:
      case 'system':
        DynamicNavbar.setLightNavigationBar(Appearance.getColorScheme() === 'light')
        _setTheme(Theme.SYSTEM)
        break
    }

    ///
    const k = await AsyncStorage.getItem(KEYS.KEEP_LAST_SECTION)
    const keep: boolean = k === '1' || k === null
    _setKeepLastSection(keep)
    if (keep) {
      const last = await AsyncStorage.getItem(KEYS.LAST_SECTION_ENTRY)
      if (last) {
        const menuEntry: MenuEntry = JSON.parse(last)
        _setCurrentCategory(menuEntry)
      } else {
        _setCurrentCategory(defaultMenuEntry)
      }
    } else {
      _setCurrentCategory(defaultMenuEntry)
    }
    ///
    const lfc = await AsyncStorage.getItem(KEYS.LAST_FIVE_CATEGORIES)
    if (lfc) {
      const lastCategories = JSON.parse(lfc)
      setLastFiveCategories(lastCategories)
    }
    ///
    const kso = await AsyncStorage.getItem(KEYS.KEEP_SCREEN_ON)
    _setKeepScreenOn(kso === '1' || kso === null)
    ///
    const r = await AsyncStorage.getItem(KEYS.READ_ALSO)
    _setReadAlso(r === '1' || r === null)
    setHydrated(true)
  }

  /**
   *
   * @returns
   */
  const getFavorites = async (): Promise<ArticleHeader[]> => {
    let favorites = await AsyncStorage.getItem(KEYS.FAVORITES)
    if (favorites) {
      return JSON.parse(favorites)
    } else {
      return []
    }
  }

  /**
   *
   * @param link
   * @returns
   */
  const hasFavorite = async (link: string): Promise<boolean> => {
    const favorites: string | null = await AsyncStorage.getItem(KEYS.FAVORITES)
    if (favorites) {
      const fav: string[] = JSON.parse(favorites)
      for (const f of fav) {
        if (f === link) {
          return true
        }
      }
      return false
    } else {
      return false
    }
  }

  const setCurrentCategory = async (m: MenuEntry): Promise<void> => {
    await AsyncStorage.setItem(KEYS.LAST_SECTION_ENTRY, JSON.stringify(m))
    _setCurrentCategory(m)

    const lastCategoriesStr = await AsyncStorage.getItem(KEYS.LAST_FIVE_CATEGORIES)
    let lastCategories: MenuEntry[] = lastCategoriesStr ? JSON.parse(lastCategoriesStr) : []
    lastCategories = lastCategories.filter((category: MenuEntry) => category.uri !== m.uri)
    lastCategories.unshift(m)
    if (lastCategories.length > 5) {
      lastCategories = lastCategories.slice(0, 5)
    }
    const newestLastCategoriesStr = JSON.stringify(lastCategories)
    await AsyncStorage.setItem(KEYS.LAST_FIVE_CATEGORIES, newestLastCategoriesStr)
    setLastFiveCategories(lastCategories)
  }

  /**
   *
   * @param b
   */
  const setDynamicStatusBarColor = async (b: boolean): Promise<void> => {
    await AsyncStorage.setItem(KEYS.DYNAMIC_STATUSBAR_COLOR, b ? '1' : '0')
    _setDynamicStatusBarColor(b)
  }

  /**
   *
   * @param feed
   */
  const setFeed = async (feed: Category[]): Promise<void> => {
    _setFeed(feed)
    await AsyncStorage.setItem(KEYS.FEED, JSON.stringify(feed))
  }

  /**
   *
   * @param b
   */
  const setKeepLastSection = async (b: boolean): Promise<void> => {
    await AsyncStorage.setItem(KEYS.KEEP_LAST_SECTION, b ? '1' : '0')
    _setKeepLastSection(b)
  }

  /**
   *
   * @param b
   */
  const setKeepScreenOn = async (b: boolean): Promise<void> => {
    await AsyncStorage.setItem(KEYS.KEEP_SCREEN_ON, b ? '1' : '0')
    _setKeepScreenOn(b)
  }

  /**
   *
   * @param b
   */
  const setReadAlso = async (b: boolean): Promise<void> => {
    await AsyncStorage.setItem(KEYS.READ_ALSO, b ? '1' : '0')
    _setReadAlso(b)
  }

  /**
   *
   * @param b
   */
  const setShare = async (b: boolean): Promise<void> => {
    await AsyncStorage.setItem(KEYS.SHARE, b ? '1' : '0')
    _setShare(b)
  }

  /**
   *
   * @param theme
   */
  const setTheme = async (theme: Theme): Promise<void> => {
    switch (theme) {
      default:
      case Theme.DARK:
        DynamicNavbar.setLightNavigationBar(false)
        break
      case Theme.LIGHT:
        DynamicNavbar.setLightNavigationBar(true)
        break
      case Theme.SYSTEM:
        DynamicNavbar.setLightNavigationBar(Appearance.getColorScheme() === 'light')
        break
    }
    _setTheme(theme)
  }

  /**
   *
   * @param item
   */
  const toggleFavorite = async (item: ArticleHeader): Promise<void> => {
    let favorites = await getFavorites()
    const index = favorites.findIndex((f) => f.url === item.url)
    if (index === -1) {
      favorites.push(item)
    } else {
      favorites.splice(index, 1)
    }
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites))
  }

  return {
    currentCategory,
    feed,
    fontScale,
    hasReadAlso,
    hasDynamicStatusBarColor,
    hydrated,
    keepLastSection,
    keepScreenOn,
    lastFiveCategories,
    share,
    theme,
    getFavorites,
    hasFavorite,
    setCurrentCategory,
    setDynamicStatusBarColor,
    setFeed,
    setKeepLastSection,
    setKeepScreenOn,
    setReadAlso,
    setShare,
    setTheme,
    toggleFavorite
  }
}

export default useSettings
