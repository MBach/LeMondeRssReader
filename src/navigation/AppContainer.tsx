import React, { useContext, useEffect } from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { DefaultTheme, LinkingOptions, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { adaptNavigationTheme, Provider, Surface } from 'react-native-paper'
import { useMaterial3Theme } from '@pchmn/expo-material3-theme'

import HomeScreen from '../screens/Home'
import FavScreen from '../screens/Favorites'
import SettingsScreen from '../screens/Settings'
import DrawerContent from './DrawerContent'
import { SettingsContext } from '../context/SettingsContext'
import ArticleScreen from '../screens/Article'
import VideoScreen from '../screens/Video'
import LiveScreen from '../screens/Live'
import { darkTheme, lightTheme } from '../constants'
import { ExtentedRssItem, Theme } from '../types'

export type HomeStackParamList = {
  Home: undefined
  Article: { item: ExtentedRssItem }
  Live: { item: ExtentedRssItem }
  Video: { item: any; url: string; type: string }
}

function HomeStack() {
  const Stack = createNativeStackNavigator<HomeStackParamList>()
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Article" component={ArticleScreen} />
      <Stack.Screen name="Live" component={LiveScreen} />
      <Stack.Screen name="Video" component={VideoScreen} />
    </Stack.Navigator>
  )
}

function DrawerNavigator() {
  type DrawerParamList = {
    HomeStack: undefined
    Favorites: undefined
    Settings: undefined
  }
  const Drawer = createDrawerNavigator<DrawerParamList>()
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false
      }}
      drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen name="HomeStack" component={HomeStack} />
      <Drawer.Screen name="Favorites" component={FavScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  )
}

type RootStackParamList = {
  Drawer: undefined
  HomeStack: undefined
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://www.lemonde.fr', 'lmfr://'],
  config: {
    screens: {
      Drawer: {
        screens: {
          HomeStack: {
            screens: {
              Home: 'home',
              Article: ':category/article',
              Live: 'live',
              Video: 'video'
            }
          },
          Favorites: 'favorites',
          Settings: 'settings'
        }
      }
    }
  }
}

export default function AppContainer() {
  const Stack = createNativeStackNavigator<RootStackParamList>()
  const settingsContext = useContext(SettingsContext)

  const { LightTheme } = adaptNavigationTheme({ reactNavigationLight: DefaultTheme })
  const { DarkTheme } = adaptNavigationTheme({ reactNavigationDark: DefaultTheme })

  const { theme } = useMaterial3Theme()
  const paperTheme = settingsContext.theme === Theme.LIGHT ? { ...lightTheme, colors: theme.light } : { ...darkTheme, colors: theme.dark }

  return (
    <Provider theme={settingsContext.theme === Theme.SYSTEM ? paperTheme : settingsContext.theme === Theme.LIGHT ? lightTheme : darkTheme}>
      <Surface style={{ flex: 1 }}>
        <NavigationContainer linking={linking} theme={settingsContext.theme === Theme.LIGHT ? LightTheme : DarkTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false
            }}>
            <Stack.Screen name="Drawer" component={DrawerNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
      </Surface>
    </Provider>
  )
}
