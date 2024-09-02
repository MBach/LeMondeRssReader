import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { HomeScreen } from '../screens/Home'
import { ArticleScreen } from '../screens/Article'
import { LiveScreen } from '../screens/Live'
import { PodcastScreen } from '../screens/Podcast'
import { VideoScreen } from '../screens/Video'
import { CustomBottomSheet } from './CustomBottomSheet'
import { MainStackParamList } from '../types'
import { forwardRef, useImperativeHandle, useState } from 'react'

export const MainStack = forwardRef((props, ref) => {
  const Stack = createNativeStackNavigator<MainStackParamList>()
  const [stackNavigation, setStackNavigation] = useState<any>(null)

  useImperativeHandle(ref, () => ({
    popToTop: () => {
      if (stackNavigation) {
        stackNavigation.popToTop()
      }
    }
  }))

  return (
    <GestureHandlerRootView>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          listeners={({ navigation }) => ({
            focus: () => setStackNavigation(navigation)
          })}
        />
        <Stack.Screen name="Article" component={ArticleScreen} />
        <Stack.Screen name="Live" component={LiveScreen} />
        <Stack.Screen name="Podcast" component={PodcastScreen} />
        <Stack.Screen name="Video" component={VideoScreen} />
      </Stack.Navigator>
      <CustomBottomSheet />
    </GestureHandlerRootView>
  )
})
