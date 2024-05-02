import React, { useContext } from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { DefaultTheme, LinkingOptions, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import { adaptNavigationTheme, Provider, Surface } from 'react-native-paper'

import { darkTheme, lightTheme } from '../constants'
import { SettingsContext } from '../context/SettingsContext'
import HomeScreen from '../screens/Home'
import FavScreen from '../screens/Favorites'
import SettingsScreen from '../screens/Settings'
import ArticleScreen from '../screens/Article'
import LiveScreen from '../screens/Live'
import PodcastScreen from '../screens/Podcast'
import VideoScreen from '../screens/Video'
import { Theme, ParsedLink } from '../types'
import DrawerContent from './DrawerContent'

export type HomeScreenNames = ['Home', 'Article', 'Live', 'Podcast', 'Video']
export type HomeStackParamList = Record<HomeScreenNames[number], ParsedLink>
export type HomeStackNavigation = NativeStackNavigationProp<HomeStackParamList>
export type DrawerNavigation = DrawerNavigationProp<HomeStackParamList>

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
      <Stack.Screen name="Podcast" component={PodcastScreen} />
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

export type RootStackParamList = {
  Drawer: undefined
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://www.lemonde.fr'],
  config: {
    screens: {
      Drawer: {
        screens: {
          HomeStack: {
            screens: {
              Home: 'home',
              Article: ':category/article/:yyyy/:mm/:dd/:title',
              Live: ':category/live/:yyyy/:mm/:dd/:title',
              Podcast: 'podcast',
              Video: ':category/video/:yyyy/:mm/:dd/:title'
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

  const paperTheme = settingsContext.theme === Theme.LIGHT ? { ...lightTheme } : { ...darkTheme }

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
