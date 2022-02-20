import React, { useContext, useEffect, useState } from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { adaptNavigationTheme, Provider, Surface, TouchableRipple, useTheme } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import HomeScreen from '../screens/Home'
import FavScreen from '../screens/Favorites'
import SettingsScreen from '../screens/Settings'
import DrawerContent from './DrawerContent'
import { SettingsContext } from '../context/SettingsContext'
import ArticleScreen from '../screens/Article'
import VideoScreen from '../screens/Video'
import LiveCommentScreen from '../screens/LiveComment'
import LiveFactScreen from '../screens/LiveFact'
import i18n from '../locales/i18n'
import { darkTheme, KEYS, lightTheme } from '../constants'
import { Appearance } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ExtentedRssItem, ParsedRssItem } from '../types'

function LiveTabsNavigator() {
  const Tab = createBottomTabNavigator()
  const { colors } = useTheme()
  const renderIcon =
    (iconSource: string) =>
    ({ focused, size }: { size: number; focused: boolean }) =>
      (
        <TouchableRipple rippleColor={colors.primary}>
          <Icon name={iconSource} size={size} color={colors.primary} />
        </TouchableRipple>
      )
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: colors.background,
        tabBarInactiveBackgroundColor: colors.background,
        tabBarStyle: { borderTopWidth: 0 }
      }}>
      <Tab.Screen
        name="LiveFact"
        options={{
          tabBarIcon: renderIcon('playlist-check'),
          tabBarLabel: i18n.t('tabs.facts')
        }}
        component={LiveFactScreen}
      />
      <Tab.Screen
        name="LiveComment"
        options={{
          tabBarIcon: renderIcon('comment-text-multiple'),
          tabBarLabel: i18n.t('tabs.live')
        }}
        component={LiveCommentScreen}
      />
    </Tab.Navigator>
  )
}

export type HomeStackParamList = {
  Home: undefined
  Article: { item: ExtentedRssItem }
  LiveTabs: { item: any; url: string; type: string }
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
      <Stack.Screen name="LiveTabs" component={LiveTabsNavigator} />
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
}

export default function AppContainer({ url }: { url: string | null }) {
  const Stack = createNativeStackNavigator<RootStackParamList>()
  const settingsContext = useContext(SettingsContext)
  const [theme, setTheme] = useState<'light' | 'dark'>(Appearance.getColorScheme() ?? 'light')

  const init = async () => {
    let themeStr: string | null = await AsyncStorage.getItem(KEYS.THEME)
    const colorScheme = Appearance.getColorScheme()
    if (themeStr) {
      if (themeStr === 'system') {
        setTheme(colorScheme ?? 'light')
      } else {
        setTheme(themeStr as 'light' | 'dark')
      }
    } else {
      setTheme(colorScheme ?? 'light')
    }
  }

  useEffect(() => {
    init()
  }, [settingsContext.theme])

  const { LightTheme } = adaptNavigationTheme({ reactNavigationLight: DefaultTheme })
  const { DarkTheme } = adaptNavigationTheme({ reactNavigationDark: DefaultTheme })

  return (
    <Provider theme={theme === 'light' ? lightTheme : darkTheme}>
      <Surface style={{ flex: 1 }}>
        <NavigationContainer theme={theme === 'light' ? LightTheme : DarkTheme}>
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
