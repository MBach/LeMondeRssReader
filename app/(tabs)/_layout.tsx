import { SettingsContext } from '@/src/context/SettingsContext'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Tabs } from 'expo-router'
import { useContext } from 'react'
import { BottomNavigation } from 'react-native-paper'
import { i18n } from '../../src/locales/i18n'

export default function TabsLayout() {
  const settingsContext = useContext(SettingsContext)

  const homeLabel = settingsContext.currentCategory
    ? settingsContext.currentCategory.isTranslatable
      ? i18n.t(`feeds.${settingsContext.currentCategory.name}`)
      : settingsContext.currentCategory.name
    : 'Home'

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route }) => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!event.defaultPrevented) navigation.navigate(route.name)
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key]
            return options.tabBarIcon?.({ focused, color, size: 24 }) ?? null
          }}
          getLabelText={({ route }) => descriptors[route.key].options.tabBarLabel as string}
        />
      )}>
      <Tabs.Screen
        name="(home)"
        options={{
          tabBarLabel: homeLabel,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarLabel: i18n.t('bottomBar.fav'),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="star-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: i18n.t('bottomBar.settings'),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" size={size} color={color} />
        }}
      />
    </Tabs>
  )
}
