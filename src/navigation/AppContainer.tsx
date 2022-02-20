import React, { useContext } from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { NavigationContainer, useRoute } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Provider as PaperProvider, Surface, ActivityIndicator, TouchableRipple, useTheme } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import HomeScreen from '../screens/Home'
import FavScreen from '../screens/Favorites'
import SettingsScreen from '../screens/Settings'
import DrawerContent from './DrawerContent'
import { SettingsContext } from '../context/SettingsContext'
import { darkTheme } from '../styles'
import ArticleScreen from '../screens/Article'
import VideoScreen from '../screens/Video'
import LiveCommentScreen from '../screens/LiveComment'
import LiveFactScreen from '../screens/LiveFact'
import i18n from '../locales/i18n'

function LiveTabsNavigator() {
  const Tab = createBottomTabNavigator()
  const { colors } = useTheme()
  const renderIcon =
    (iconSource: string) =>
    ({ focused, size }: { size: number; focused: boolean }) =>
      (
        <TouchableRipple rippleColor={colors.primary}>
          <Icon name={iconSource} size={size} color={focused ? colors.primary : colors.divider} />
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

function HomeStack() {
  const Stack = createNativeStackNavigator()
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

export default function AppContainer({ url }: { url: string | null }) {
  type RootStackParamList = {
    Drawer: undefined
    Article: { item: any; url: string; type: string }
    LiveTabs: undefined
    Podcast: undefined
    Video: undefined
  }
  const Stack = createNativeStackNavigator<RootStackParamList>()
  const settingsContext = useContext(SettingsContext)
  if (settingsContext.hydrated) {
    return (
      <PaperProvider theme={settingsContext.theme}>
        <Surface style={{ flex: 1 }}>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false
              }}
              initialRouteName={url ? 'Article' : 'Drawer'}>
              <Stack.Screen name="Drawer" component={DrawerNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
        </Surface>
      </PaperProvider>
    )
  } else {
    return (
      <PaperProvider theme={darkTheme}>
        <Surface style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
          <ActivityIndicator size="large" />
        </Surface>
      </PaperProvider>
    )
  }
}
