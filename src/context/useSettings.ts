import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import { HTMLElement } from 'node-html-parser'

//import DynamicNavbar from '../DynamicNavbar'
import { Category, ExtentedRssItem, MenuEntry } from '../types'
import defaultFeeds from '../feeds.json'
import { KEYS } from '../constants'

export interface UseSettingsType {
  currentCategory: MenuEntry | null
  doc: HTMLElement | null
  feed: Category[]
  fontScale: number
  hasDynamicStatusBarColor: boolean
  hydrated: boolean
  keepLastSection: boolean
  share: boolean
  theme: 'dark' | 'light'
  getFavorites: () => Promise<ExtentedRssItem[]>
  hasFavorite: (link: string) => Promise<boolean>
  popCategories: () => void
  setCurrentCategory: (c: MenuEntry) => Promise<void>
  setDoc: (d: HTMLElement | null) => void
  setDynamicStatusBarColor: (b: boolean) => Promise<void>
  setFeed: (feed: Category[]) => Promise<void>
  setKeepLastSection: (b: boolean) => Promise<void>
  setShare: (b: boolean) => Promise<void>
  setTheme: (theme: 'dark' | 'light') => Promise<void>
  toggleFavorite: (item: ExtentedRssItem) => Promise<void>
}

// Default values
export const initialSettingsContext = {
  currentCategory: null,
  hydrated: false,
  fontScale: 1,
  feed: defaultFeeds,
  doc: null,
  share: true,
  keepLastSection: true,
  hasDynamicStatusBarColor: true
} as UseSettingsType

const defaultMenuEntry: MenuEntry = {
  cat: 'news',
  color: '#775a00',
  name: 'latestNews',
  uri: 'rss/une.xml'
}

const useSettings = (): UseSettingsType => {
  const [hydrated, setHydrated] = useState<boolean>(false)
  const [fontScale, setFontScale] = useState<number>(1)
  const [theme, _setTheme] = useState<'dark' | 'light'>('dark')
  const [feed, _setFeed] = useState<Category[]>(defaultFeeds)
  const [doc, setDoc] = useState<HTMLElement | null>(null)
  const [keepLastSection, _setKeepLastSection] = useState<boolean>(true)
  const [hasDynamicStatusBarColor, _setDynamicStatusBarColor] = useState<boolean>(true)
  const [share, _setShare] = useState<boolean>(true)
  const [currentCategory, _setCurrentCategory] = useState<MenuEntry | null>(null)
  const [categories, setCategories] = useState<MenuEntry[]>([])

  useEffect(() => {
    _init()
  }, [])

  const _init = async (): Promise<void> => {
    setFontScale(await DeviceInfo.getFontScale())
    //DynamicNavbar.setLightNavigationBar(!isDark)
    const f = await AsyncStorage.getItem(KEYS.FEED)
    _setFeed(f ? JSON.parse(f) : defaultFeeds)
    ///
    const s = await AsyncStorage.getItem(KEYS.SHARE)
    _setShare(s === '1' || s === null)
    ///
    const d = await AsyncStorage.getItem(KEYS.DYNAMIC_STATUSBAR_COLOR)
    _setDynamicStatusBarColor(d === '1' || d === null)
    ///
    const k = await AsyncStorage.getItem(KEYS.KEEP_LAST_SECTION)
    const keep: boolean = k === '1' || k === null
    _setKeepLastSection(keep)
    if (keep) {
      const last = await AsyncStorage.getItem(KEYS.LAST_SECTION_ENTRY)
      if (last) {
        const menuEntry: MenuEntry = JSON.parse(last)
        _setCurrentCategory(menuEntry)
        setCategories([...categories, menuEntry])
      } else {
        _setCurrentCategory(defaultMenuEntry)
        setCategories([...categories, defaultMenuEntry])
      }
    } else {
      //_setCurrentCategory(defaultMenuEntry)
      //setCategories([...categories, defaultMenuEntry])
    }
    setHydrated(true)
  }

  /**
   *
   * @returns
   */
  const getFavorites = async (): Promise<ExtentedRssItem[]> => {
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
      const fav: ExtentedRssItem[] = JSON.parse(favorites)
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

  const popCategories = (): void => {
    console.log('popCategories A', categories.length, categories)
    if (categories.length > 0) {
      const lastCategory = categories[categories.length - 1]
      if (lastCategory) {
        let a = [...categories.splice(-1)]
        setCategories(a)
        console.log('popCategories B', a.length, a)
        AsyncStorage.setItem(KEYS.LAST_SECTION_ENTRY, JSON.stringify(lastCategory))
        _setCurrentCategory(lastCategory)
      }
    }
  }

  const setCurrentCategory = async (m: MenuEntry): Promise<void> => {
    setCategories([...categories, m])
    await AsyncStorage.setItem(KEYS.LAST_SECTION_ENTRY, JSON.stringify(m))
    _setCurrentCategory(m)
    console.log('setCurrentCategory', categories)
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
  const setShare = async (b: boolean): Promise<void> => {
    await AsyncStorage.setItem(KEYS.SHARE, b ? '1' : '0')
    _setShare(b)
  }

  /**
   *
   * @param theme
   */
  const setTheme = async (theme: 'dark' | 'light'): Promise<void> => {
    _setTheme(theme)
  }

  /**
   *
   * @param item
   */
  const toggleFavorite = async (item: ExtentedRssItem): Promise<void> => {
    let favorites = await getFavorites()
    const index = favorites.findIndex((f) => f.link === item.link)
    if (index === -1) {
      favorites.push(item)
    } else {
      favorites.splice(index, 1)
    }
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites))
  }

  return {
    currentCategory,
    doc,
    feed,
    fontScale,
    hasDynamicStatusBarColor,
    hydrated,
    keepLastSection,
    share,
    theme,
    getFavorites,
    hasFavorite,
    popCategories,
    setCurrentCategory,
    setDoc,
    setDynamicStatusBarColor,
    setFeed,
    setKeepLastSection,
    setShare,
    setTheme,
    toggleFavorite
  }
}

export default useSettings
