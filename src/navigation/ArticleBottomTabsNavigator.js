import React, { useEffect, useState } from 'react'
import { Image } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme, TouchableRipple } from 'react-native-paper'

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
export default function ArticleBottomTabsNavigator({ route }) {
  const Tab = createBottomTabNavigator()
  const { item, isLive } = route.params
  const [content, setContent] = useState(null)
  const { colors } = useTheme()

  useEffect(() => {
    getContent()
  }, [])

  const getContent = async () => {
    //const response = await ky.get(route.params.url)
    //const doc = new DOMParser().parseFromString(await response.text(), 'text/html')
    //const doc = parse(await response.text())
    //setContent(doc)
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
            {(props) => <LiveFactScreen {...props} content={content} />}
          </Tab.Screen>
          <Tab.Screen
            name="Comment"
            options={{
              tabBarIcon: renderIcon(IconInfo),
              tabBarLabel: 'Suivez le live',
            }}>
            {(props) => <LiveCommentScreen {...props} content={content} />}
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
            {(props) => <ArticleScreen {...props} item={item} />}
          </Tab.Screen>
          <Tab.Screen
            name="Comment"
            options={{
              tabBarIcon: renderIcon(IconInfo),
              tabBarLabel: 'Commentaires',
            }}>
            {(props) => content && <CommentScreen {...props} content={content} />}
          </Tab.Screen>
        </>
      )}
    </Tab.Navigator>
  )
}
