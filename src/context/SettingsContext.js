import React, { Component } from 'react'
import { Provider as PaperProvider } from 'react-native-paper'
import AsyncStorage from '@react-native-community/async-storage'

import { darkTheme, lightTheme } from '../styles'
import DynamicNavbar from '../DynamicNavbar'

const defaultFeeds = require('../feeds.json')

export const SettingsContext = React.createContext()

export default class SettingsProvider extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hydrated: false,
      theme: {},
      feed: [],
      toggleFavorite: async (item) => {
        let favorites = await this.state.getFavorites()
        const index = favorites.findIndex((f) => f.link === item.link)
        if (index === -1) {
          favorites.push(item)
        } else {
          favorites.splice(index, 1)
        }
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites))
      },
      hasFavorite: async (link) => {
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
      },
      getFavorites: async () => {
        let favorites = await AsyncStorage.getItem('favorites')
        if (favorites) {
          return JSON.parse(favorites)
        } else {
          return []
        }
      },
      setShare: async (shared) => {
        const isShared = shared ? '1' : '0'
        await AsyncStorage.setItem('share', isShared)
      },
      getShare: async () => await AsyncStorage.getItem('share'),
      setTheme: async (theme) => {
        const isDark = theme === 'dark'
        this.setState((state) => ({
          ...state,
          theme: isDark ? darkTheme : lightTheme,
        }))
        DynamicNavbar.setLightNavigationBar(!isDark)
        await AsyncStorage.setItem('theme', theme)
      },
      getTheme: async () => await AsyncStorage.getItem('theme'),
      setFeed: async (feed) => {
        this.setState((state) => ({
          ...state,
          feed,
        }))
        await AsyncStorage.setItem('feed', JSON.stringify(feed))
      },
      getFeed: async () => {
        const feed = await AsyncStorage.getItem('feed')
        return feed ? JSON.parse(feed) : defaultFeeds
      },
    }
  }

  async componentDidMount() {
    let state = { hydrated: true }
    const t = await this.state.getTheme()
    const isDark = t === null || t === 'dark'
    state.theme = isDark ? darkTheme : lightTheme
    DynamicNavbar.setLightNavigationBar(!isDark)
    const f = await this.state.getFeed()
    state.feed = f
    this.setState(state)
  }

  render() {
    const { hydrated, theme } = this.state
    if (hydrated) {
      return (
        <SettingsContext.Provider value={{ settingsContext: this.state }}>
          <PaperProvider theme={theme}>{this.props.children}</PaperProvider>
        </SettingsContext.Provider>
      )
    } else {
      return false
    }
  }
}
