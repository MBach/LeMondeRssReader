import React, { Component } from 'react'
import { Provider as PaperProvider } from 'react-native-paper'
import AsyncStorage from '@react-native-community/async-storage'

import { darkTheme, lightTheme } from '../styles'

const defaultFeeds = require('../feeds.json')

export const SettingsContext = React.createContext()

export default class SettingsProvider extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hydrated: false,
      theme: {},
      feed: [],
      setTheme: async theme => {
        this.setState(state => ({
          ...state,
          theme: theme === 'dark' ? darkTheme : lightTheme
        }))
        await AsyncStorage.setItem('theme', theme)
      },
      getTheme: async () => {
        return await AsyncStorage.getItem('theme')
      },
      setFeed: async feed => {
        this.setState(state => ({
          ...state,
          feed
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
      }
    }
  }

  async componentDidMount() {
    const t = await this.state.getTheme()
    if (t === null || t === 'dark') {
      this.setState({ theme: darkTheme, hydrated: true })
    } else {
      this.setState({ theme: lightTheme, hydrated: true })
    }
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
