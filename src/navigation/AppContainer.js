import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'

import ArticleBottomTabsNavigator from './ArticleBottomTabsNavigator'
import HomeScreen from '../screens/Home'
import FavScreen from '../screens/Favorites'
import SettingsScreen from '../screens/Settings'
import DrawerContent from './DrawerContent'

const Stack = createStackNavigator()
const Drawer = createDrawerNavigator()

function DrawerNavigator() {
  return (
    <Drawer.Navigator drawerContent={props => <DrawerContent {...props} />}>
      <Drawer.Screen name="Home">{props => <HomeScreen {...props} />}</Drawer.Screen>
    </Drawer.Navigator>
  )
}

export default function AppContainer() {
  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="none">
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
        <Stack.Screen name="Favorites" component={FavScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ArticleBottomTabsNavigator" component={ArticleBottomTabsNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
