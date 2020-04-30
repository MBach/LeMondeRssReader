import React, { useEffect, useState } from 'react'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTheme, TouchableRipple } from 'react-native-paper'
import ky from 'ky'
import { parse } from 'node-html-parser'

import i18n from '../locales/i18n'
import ArticleScreen from '../screens/Article'
import CommentScreen from '../screens/Comments'
import LiveCommentScreen from '../screens/LiveComment'
import LiveFactScreen from '../screens/LiveFact'
import VideoScreen from '../screens/Video'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function BottomTabsNavigator({ route, url }) {
  const Tab = createBottomTabNavigator()
  const [type, setType] = useState(route.params?.type)
  const { colors } = useTheme()

  const [doc, setDoc] = useState()
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    init()
  }, [refresh])

  const init = async () => {
    if (route.params && route.params.item) {
      const response = await ky.get(route.params.item.link)
      const d = parse(await response.text())
      setDoc(d)
    } else {
      const regex = /https:\/\/www\.lemonde\.fr\/([\w-]+)\/(\w+)\/.*/g
      const b = regex.exec(url)
      setType(b && b.length === 3 && b[2] === 'live')
      const response = await ky.get(url)
      const d = parse(await response.text())
      setDoc(d)
    }
    if (refresh) {
      setRefresh(false)
    }
  }

  const renderIcon = (iconSource) => ({ focused, size }) => (
    <TouchableRipple rippleColor={colors.primary}>
      <Icon name={iconSource} size={size} color={focused ? colors.primary : colors.divider} />
    </TouchableRipple>
  )

  const commentScreen = (
    <Tab.Screen
      name="Comment"
      options={{
        tabBarIcon: renderIcon('comment-text'),
        tabBarLabel: i18n.t('tabs.comments'),
      }}>
      {(props) => <CommentScreen {...props} route={route} />}
    </Tab.Screen>
  )

  const renderArticle = () => (
    <>
      <Tab.Screen
        name="Article"
        options={{
          tabBarIcon: renderIcon('view-headline'),
          tabBarLabel: i18n.t('tabs.article'),
        }}>
        {(props) => <ArticleScreen {...props} route={route} doc={doc} url={url} />}
      </Tab.Screen>
      {commentScreen}
    </>
  )

  const renderLive = () => (
    <>
      <Tab.Screen
        name="Article"
        options={{
          tabBarIcon: renderIcon('playlist-check'),
          tabBarLabel: i18n.t('tabs.facts'),
        }}>
        {(props) => <LiveFactScreen {...props} route={route} doc={doc} />}
      </Tab.Screen>
      <Tab.Screen
        name="Comment"
        options={{
          tabBarIcon: renderIcon('comment-text-multiple'),
          tabBarLabel: i18n.t('tabs.live'),
        }}>
        {(props) => <LiveCommentScreen {...props} route={route} doc={doc} onRefresh={() => setRefresh(true)} />}
      </Tab.Screen>
    </>
  )

  const renderVideo = () => (
    <>
      <Tab.Screen
        name="Video"
        options={{
          tabBarIcon: renderIcon('video-outline'),
          tabBarLabel: i18n.t('tabs.video'),
        }}>
        {(props) => <VideoScreen {...props} route={route} doc={doc} url={url} />}
      </Tab.Screen>
      {commentScreen}
    </>
  )

  const renderTabs = () => {
    switch (type) {
      default:
      case 'article':
        return renderArticle()
      case 'live':
        return renderLive()
      case 'video':
        return renderVideo()
    }
  }

  return (
    <Tab.Navigator
      tabBarOptions={{
        activeTintColor: colors.primary,
        activeBackgroundColor: colors.background,
        inactiveBackgroundColor: colors.background,
        style: { borderTopWidth: 0 },
      }}>
      {renderTabs()}
    </Tab.Navigator>
  )
}
