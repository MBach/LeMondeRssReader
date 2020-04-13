import React, { useEffect, useState } from 'react'
import { Image, StatusBar } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme, TouchableRipple } from 'react-native-paper'
import ky from 'ky'
import { parse } from 'node-html-parser'

import ArticleScreen from '../screens/Article'
import CommentScreen from '../screens/Comments'
import LiveCommentScreen from '../screens/LiveComment'
import LiveFactScreen from '../screens/LiveFact'

import { IconHome, IconInfo } from '../assets/Icons'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function BottomTabsNavigator({ route }) {
  const Tab = createBottomTabNavigator()
  const { item, isLive } = route.params
  const { colors } = useTheme()

  const [doc, setDoc] = useState()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const response = await ky.get(item.link)
    const d = parse(await response.text())
    setDoc(d)
  }

  const renderIcon = (icon) => ({ focused, size }) => (
    <TouchableRipple rippleColor={colors.primary}>
      <Image
        source={icon}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
          tintColor: focused ? colors.primary : colors.text,
        }}
      />
    </TouchableRipple>
  )

  return (
    <>
      <StatusBar backgroundColor={'rgba(0,0,0,0.5)'} translucent />
      <Tab.Navigator
        tabBarOptions={{
          activeTintColor: colors.primary,
          activeBackgroundColor: colors.background,
          inactiveBackgroundColor: colors.background,
        }}>
        {isLive ? (
          <>
            <Tab.Screen
              name="Article"
              options={{
                tabBarIcon: renderIcon(IconHome),
                tabBarLabel: 'Les faits',
              }}>
              {(props) => <LiveFactScreen {...props} doc={doc} item={item} />}
            </Tab.Screen>
            <Tab.Screen
              name="Comment"
              options={{
                tabBarIcon: renderIcon(IconInfo),
                tabBarLabel: 'Suivez le live',
              }}>
              {(props) => <LiveCommentScreen {...props} doc={doc} item={item} />}
            </Tab.Screen>
          </>
        ) : (
          <>
            <Tab.Screen
              name="Article"
              options={{
                tabBarIcon: renderIcon(IconHome),
                tabBarLabel: 'Article',
              }}>
              {(props) => <ArticleScreen {...props} doc={doc} item={item} />}
            </Tab.Screen>
            <Tab.Screen
              name="Comment"
              options={{
                tabBarIcon: renderIcon(IconInfo),
                tabBarLabel: 'Commentaires',
              }}>
              {(props) => <CommentScreen {...props} doc={doc} item={item} />}
            </Tab.Screen>
          </>
        )}
      </Tab.Navigator>
    </>
  )
}
