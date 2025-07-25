import { useContext, useRef } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BottomNavigation } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { SettingsContext } from '../context/SettingsContext'
import { i18n } from '../locales/i18n'
import { MainStack } from './MainStack'
import { FavScreen } from '../screens/Favorites'
import { SettingsScreen } from '../screens/Settings'
import { RootStackParamList } from '../types'

export function RootStack() {
  const mainStackRef = useRef<any>(null)
  const settingsContext = useContext(SettingsContext)
  const Tab = createBottomTabNavigator<RootStackParamList>()
  const renderTabIcon =
    (iconName: string) =>
    ({ color, size }: { color: string; size: number }) => <Icon name={iconName} size={size} color={color} />
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        lazy: false
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route }) => {
            const currentRouteName = state.routes[state.index].name
            const isAlreadyOnMainStack = currentRouteName === 'MainStack'

            if (route.name === 'MainStack') {
              if (isAlreadyOnMainStack) {
                const stackState = route.state as { index: number; routes: any[] } | undefined
                const currentNestedRoute = stackState?.routes?.[stackState.index]?.name
                if (currentNestedRoute !== 'Home') {
                  console.log('currentNestedRoute', currentNestedRoute)
                  navigation.navigate('MainStack', { screen: 'Home' })
                }
              } else {
                navigation.navigate('MainStack')
              }
            } else {
              navigation.navigate(route.name, route.params)
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key]
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused, color, size: 24 })
            }
            return null
          }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key]
            return options.tabBarLabel as string
          }}
        />
      )}>
      <Tab.Screen
        name="MainStack"
        children={() => <MainStack ref={mainStackRef} />}
        options={{
          tabBarLabel: settingsContext.currentCategory
            ? settingsContext.currentCategory.isTranslatable
              ? i18n.t(`feeds.${settingsContext.currentCategory.name}`)
              : settingsContext.currentCategory.name
            : 'Home',
          tabBarIcon: renderTabIcon('home')
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavScreen}
        options={{
          tabBarLabel: i18n.t('bottomBar.fav'),
          tabBarIcon: renderTabIcon('star-outline')
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: i18n.t('bottomBar.settings'),
          tabBarIcon: renderTabIcon('cog')
        }}
      />
    </Tab.Navigator>
  )
}
