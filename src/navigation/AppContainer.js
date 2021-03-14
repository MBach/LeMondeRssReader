import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import HomeScreen from '../screens/Home'
import FavScreen from '../screens/Favorites'
import SettingsScreen from '../screens/Settings'
import BottomTabsNavigator from './BottomTabsNavigator'
import DrawerContent from './DrawerContent'
import { Surface } from 'react-native-paper'

const Stack = createStackNavigator()
const Drawer = createDrawerNavigator()

function DrawerNavigator() {
  return (
    <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Favorites" component={FavScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  )
}

export default function AppContainer({ url }) {
  return (
    <Surface style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator headerMode="none" initialRouteName={url ? 'BottomTabsNavigator' : 'Drawer'}>
          <Stack.Screen name="Drawer" component={DrawerNavigator} />
          <Stack.Screen name="BottomTabsNavigator">{(props) => <BottomTabsNavigator {...props} url={url} />}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </Surface>
  )
}
