import React, { useContext, useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { Drawer, Surface } from 'react-native-paper'

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
export default function DrawerContent({ route, navigation, state, ...rest }) {
  const { settingsContext } = useContext(SettingsContext)

  const category = state && state.routes[0] && state.routes[0].params && state.routes[0].params.category

  const [feed, setFeed] = useState([])

  useEffect(() => {
    settingsContext.getFeed().then(data => {
      let entries = []
      for (const index in data) {
        const d = data[index]
        for (const f of d.feeds) {
          if (f.active) {
            entries.push({
              cat: d.cat,
              color: d.color,
              feed: f.name,
              uri: f.uri
            })
          }
        }
      }
      setFeed(entries)
    })
  }, [])

  return (
    <Surface style={{ flex: 1 }}>
      <DrawerContentScrollView {...rest}>
        <Drawer.Section title={i18n.t(`drawer.feed`)}>
          {feed.map((f, index) => (
            <Drawer.Item
              key={index}
              icon={() => <Image source={IconCircle} style={{ width: 28, height: 28, tintColor: f.color }} />}
              label={i18n.t(`feeds.${f.feed}`)}
              onPress={() =>
                navigation.navigate('Home', {
                  title: i18n.t(`feeds.${f.feed}`),
                  uri: f.uri
                })
              }
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
