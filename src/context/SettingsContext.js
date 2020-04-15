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
      setTheme: async (theme) => {
        const isDark = theme === 'dark'
        this.setState((state) => ({
          ...state,
          theme: isDark ? darkTheme : lightTheme,
        }))
        DynamicNavbar.setLightNavigationBar(!isDark)
        await AsyncStorage.setItem('theme', theme)
      },
      getTheme: async () => {
        return await AsyncStorage.getItem('theme')
      },
      setFeed: async (feed) => {
        this.setState((state) => ({
          ...state,
          feed,
        }))
        await AsyncStorage.setItem('feed', JSON.stringify(feed))
      },
      getFeed: async () => {
        const feed = await AsyncStorage.getItem('feed')
        if (feed) {
          return JSON.parse(feed)
        } else {
          return defaultFeeds
        }
      },
    }
  }

  async componentDidMount() {
    const t = await this.state.getTheme()
    const isDark = t === null || t === 'dark'
    if (isDark) {
      this.setState({ theme: darkTheme, hydrated: true })
    } else {
      this.setState({ theme: lightTheme, hydrated: true })
    }
    DynamicNavbar.setLightNavigationBar(!isDark)
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
