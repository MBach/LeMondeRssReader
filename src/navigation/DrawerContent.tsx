import React, { useContext, useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { Drawer, Surface, useTheme } from 'react-native-paper'
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { IconStar } from '../assets'
import i18n from '../locales/i18n'
import { SettingsContext } from '../context/SettingsContext'
import { MenuEntry } from '../types'
import { UseSettingsType } from '../context/useSettings'

const styles = StyleSheet.create({
  favItem: {
    width: 24,
    height: 24
  }
})

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function DrawerContent({ navigation, state, ...rest }: DrawerContentComponentProps) {
  const settingsContext: UseSettingsType = useContext(SettingsContext)
  const [categories, setCategories] = useState<Map<String, MenuEntry[]>>(new Map())
  const theme = useTheme()

  useEffect(() => {
    let cats = new Map<String, MenuEntry[]>()
    for (const d of settingsContext.feed) {
      for (const f of d.subCats) {
        if (f.active) {
          let newMenuEntry: MenuEntry = {
            cat: d.cat,
            color: theme.dark ? d.color.dark : d.color.light,
            name: f.name,
            uri: f.uri,
            subPath: f.subPath
          }
          let c = cats.get(d.cat)
          if (!c) {
            c = []
          }
          c.push(newMenuEntry)
          cats.set(d.cat, c)
        }
      }
    }
    setCategories(cats)
  }, [settingsContext.feed])

  const renderSections = () => {
    return [...categories.keys()].map((catName: string) => {
      const entries = categories.get(catName)
      return (
        <Drawer.Section key={catName} title={i18n.t(`categories.${catName}`)}>
          {entries.map((entry: MenuEntry, index: number) => (
            <Drawer.Item
              key={index}
              icon={() => <Icon name="circle" color={entry.color} size={28} />}
              label={i18n.t(`feeds.${entry.name}`)}
              onPress={() => {
                settingsContext.setCurrentCategory(entry)
                navigation.closeDrawer()
                if (settingsContext.currentCategory?.uri !== entry.uri) {
                  navigation.push('Home', entry)
                }
              }}
              active={settingsContext.currentCategory?.uri === entry.uri}
            />
          ))}
        </Drawer.Section>
      )
    })
  }

  return (
    <Surface style={{ flex: 1 }}>
      <DrawerContentScrollView {...rest}>
        {renderSections()}
        <Drawer.Section title={i18n.t(`drawer.app`)}>
          <Drawer.Item
            icon={() => <Image source={IconStar} style={styles.favItem} />}
            label={i18n.t(`drawer.fav`)}
            onPress={() => navigation.navigate('Favorites')}
          />
          <Drawer.Item icon="tune" label={i18n.t(`drawer.settings`)} onPress={() => navigation.navigate('Settings')} />
        </Drawer.Section>
      </DrawerContentScrollView>
    </Surface>
  )
}
