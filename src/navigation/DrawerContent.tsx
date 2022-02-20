import React, { useContext, useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { Drawer, Surface, useTheme } from 'react-native-paper'

import { IconCircle, IconStar } from '../assets/Icons'
import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'

const styles = StyleSheet.create({
  item: {
    marginLeft: 0,
    paddingLeft: 16,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24
  },
  favItem: {
    width: 24,
    height: 24,
    marginLeft: 2
  }
})

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function DrawerContent({ navigation, state, ...rest }: DrawerContentComponentProps) {
  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()

  const category = state && state.routes[0] && state.routes[0].params && state.routes[0].params.category

  const [feed, setFeed] = useState<any[]>([])

  useEffect(() => {
    let entries = []
    for (const index in settingsContext.feed) {
      const d = settingsContext.feed[index]
      for (const f of d.feeds) {
        if (f.active) {
          entries.push({
            cat: d.cat,
            color: d.color,
            feed: f.name,
            uri: f.uri,
            subPath: f.subPath
          })
        }
      }
    }
    setFeed(entries)
  }, [settingsContext.feed])

  return (
    <Surface style={{ flex: 1 }}>
      <DrawerContentScrollView {...rest}>
        <Drawer.Section title={i18n.t(`drawer.feed`)}>
          {feed.map((f, index) => (
            <Drawer.Item
              key={index}
              icon={() => (
                <Image
                  source={IconCircle}
                  style={{ width: 28, height: 28, tintColor: f.color, borderWidth: 1, borderColor: colors.disabled, borderRadius: 14 }}
                />
              )}
              label={i18n.t(`feeds.${f.feed}`)}
              onPress={() => {
                navigation.closeDrawer()
                navigation.push('Home', {
                  title: i18n.t(`feeds.${f.feed}`),
                  uri: f.uri,
                  subPath: f.subPath
                })
              }}
              style={styles.item}
              active={category === f.cat || category === null}
            />
          ))}
        </Drawer.Section>
        <Drawer.Item
          icon={() => <Image source={IconStar} style={styles.favItem} />}
          label={i18n.t(`drawer.fav`)}
          onPress={() => navigation.navigate('Favorites')}
          style={styles.item}
        />
        <Drawer.Item icon="tune" label={i18n.t(`drawer.settings`)} onPress={() => navigation.navigate('Settings')} style={styles.item} />
      </DrawerContentScrollView>
    </Surface>
  )
}
