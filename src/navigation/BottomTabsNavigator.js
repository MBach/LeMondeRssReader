import React, { useEffect, useState } from 'react'
import { StatusBar } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme, TouchableRipple } from 'react-native-paper'
import ky from 'ky'
import { parse } from 'node-html-parser'

import ArticleScreen from '../screens/Article'
import CommentScreen from '../screens/Comments'
import LiveCommentScreen from '../screens/LiveComment'
import LiveFactScreen from '../screens/LiveFact'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function BottomTabsNavigator({ route, url }) {
  const Tab = createBottomTabNavigator()
  const [isLive, setIsLive] = useState(route.params?.isLive)
  const { colors } = useTheme()

  const [doc, setDoc] = useState()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    if (route.params && route.params.item) {
      const response = await ky.get(route.params.item.link)
      const d = parse(await response.text())
      setDoc(d)
    } else {
      const regex = /https:\/\/www\.lemonde\.fr\/([\w-]+)\/(\w+)\/.*/g
      const b = regex.exec(url)
      setIsLive(b && b.length === 3 && b[2] === 'live')
      const response = await ky.get(url)
      const d = parse(await response.text())
      setDoc(d)
    }
  }

  const renderIcon = (iconSource) => ({ focused, size }) => (
    <TouchableRipple rippleColor={colors.primary}>
      <Icon name={iconSource} size={size} color={focused ? colors.primary : colors.divider} />
    </TouchableRipple>
  )

  return (
    <>
      <Tab.Navigator
        tabBarOptions={{
          activeTintColor: colors.primary,
          activeBackgroundColor: colors.background,
          inactiveBackgroundColor: colors.background,
          style: { borderTopWidth: 0 },
        }}>
        {isLive ? (
          <>
            <Tab.Screen
              name="Article"
              options={{
                tabBarIcon: renderIcon('playlist-check'),
                tabBarLabel: 'Les faits',
              }}>
              {(props) => <LiveFactScreen {...props} route={route} doc={doc} />}
            </Tab.Screen>
            <Tab.Screen
              name="Comment"
              options={{
                tabBarIcon: renderIcon('comment-text-multiple'),
                tabBarLabel: 'Suivez le live',
              }}>
              {(props) => <LiveCommentScreen {...props} route={route} doc={doc} />}
            </Tab.Screen>
          </>
        ) : (
          <>
            <Tab.Screen
              name="Article"
              options={{
                tabBarIcon: renderIcon('view-headline'),
                tabBarLabel: 'Article',
              }}>
              {(props) => <ArticleScreen {...props} route={route} doc={doc} url={url} />}
            </Tab.Screen>
            <Tab.Screen
              name="Comment"
              options={{
                tabBarIcon: renderIcon('comment-text'),
                tabBarLabel: 'Commentaires',
              }}>
              {(props) => <CommentScreen {...props} route={route} />}
            </Tab.Screen>
          </>
        )}
      </Tab.Navigator>
    </>
  )
}
