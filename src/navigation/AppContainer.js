import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { NavigationContainer } from '@react-navigation/native'
import { createSharedElementStackNavigator } from 'react-navigation-shared-element'

import HomeScreen from '../screens/Home'
import FavScreen from '../screens/Favorites'
import SettingsScreen from '../screens/Settings'
import BottomTabsNavigator from './BottomTabsNavigator'
import DrawerContent from './DrawerContent'

const Stack = createSharedElementStackNavigator()
const Drawer = createDrawerNavigator()

function DrawerNavigator() {
  return (
    <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen name="Home">{(props) => <HomeScreen {...props} />}</Drawer.Screen>
      <Drawer.Screen name="Favorites" component={FavScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  )
}

export default function AppContainer({ url }) {
  return (
    <NavigationContainer>
      <Stack.Navigator headerMode="none" initialRouteName={url ? 'BottomTabsNavigator' : 'Drawer'}>
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
        <Stack.Screen
          name="BottomTabsNavigator"
          component={(props) => <BottomTabsNavigator {...props} url={url} />}
          sharedElements={(route, otherRoute, showing) => {
            if (!showing) {
              return false
            } else if (otherRoute.name === 'Drawer' && route?.params?.item) {
              return [`item.${route?.params?.item.id}.photo`]
            } else {
              return false
            }
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
