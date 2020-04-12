import React, { useContext, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View, StatusBar } from 'react-native'
import {
  useTheme,
  Caption,
  Chip,
  Divider,
  Paragraph,
  Subheading,
  Surface,
  Switch,
  TouchableRipple,
  ActivityIndicator,
} from 'react-native-paper'

import { SettingsContext } from '../context/SettingsContext'
import i18n from '../locales/i18n'
import DynamicNavbar from '../DynamicNavbar'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function SettingsScreen() {
  const { settingsContext } = useContext(SettingsContext)

  const [dark, setDark] = useState(true)
  const [data, setData] = useState(null)

  const { colors } = useTheme()

  const styles = StyleSheet.create({
    flex: {
      flex: 1,
    },
    surfaceContainer: {
      padding: 16,
    },
    rippleMarginTop: {
      marginTop: 16,
    },
    divider: {
      backgroundColor: colors.divider,
    },
    chipContainer: {
      flex: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginLeft: -2,
      marginBottom: 8,
    },
    catChip: {
      marginVertical: 4,
    },
    chip: {
      marginHorizontal: 2,
      marginBottom: 8,
    },
  })

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const theme = await settingsContext.getTheme()
    const isDark = theme === null || theme === 'dark'
    setDark(isDark)
    DynamicNavbar.setLightNavigationBar(!isDark)
    const feed = await settingsContext.getFeed()
    if (feed) {
      setData(feed)
    }
  }

  const changeTheme = (setTheme) => () => {
    setDark(!dark)
    setTheme(!dark ? 'dark' : 'light')
  }

  const toogleItem = (idxCat, idxFeed) => () => {
    let d = [...data]
    let o = d[idxCat].feeds[idxFeed]
    o.active = !o.active
    setData(d)
    settingsContext.setFeed(d)
  }

  const renderEditableMenu = () => {
    let items = []
    data.map((d, idxCat) => {
      items.push(
        <Caption key={`cat-${idxCat}`} style={styles.catChip}>
          {i18n.t(`categories.${d.cat}`)}
        </Caption>
      )
      items.push(
        <View key={`feeds-${idxCat}`} style={styles.chipContainer}>
          {d.feeds.map((feed, idxFeed) => (
            <Chip
              key={idxFeed}
              selected={feed.active}
              selectedColor={feed.active ? colors.primary : colors.text}
              style={styles.chip}
              onPress={toogleItem(idxCat, idxFeed)}>
              {i18n.t(`feeds.${feed.name}`)}
            </Chip>
          ))}
        </View>
      )
    })
    return items
  }

  return (
    <Surface style={{ flex: 1 }}>
      <StatusBar backgroundColor={colors.statusBar} translucent />
      <SettingsContext.Consumer>
        {({ settingsContext }) => (
          <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
            <Surface style={styles.surfaceContainer}>
              <Paragraph style={{ color: colors.primary }}>{i18n.t('settings.layout.title')}</Paragraph>
              <TouchableRipple rippleColor={colors.accent} style={styles.rippleMarginTop}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.flex}>
                    <Subheading>{i18n.t('settings.layout.content1')}</Subheading>
                    <Caption>{i18n.t('settings.layout.desc1')}</Caption>
                  </View>
                  <Switch value={true} />
                </View>
              </TouchableRipple>
            </Surface>
            <Divider style={{ backgroundColor: colors.divider }} />
            <Surface style={styles.surfaceContainer}>
              <Paragraph style={{ color: colors.primary }}>{i18n.t('settings.display.title')}</Paragraph>
              <TouchableRipple rippleColor={colors.accent} style={styles.rippleMarginTop} onPress={changeTheme(settingsContext.setTheme)}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.flex}>
                    <Subheading>{i18n.t('settings.display.styleTitle')}</Subheading>
                    <Caption>{i18n.t('settings.display.styleDesc')}</Caption>
                  </View>
                  <Switch value={dark} onValueChange={changeTheme(settingsContext.setTheme)} />
                </View>
              </TouchableRipple>
              <TouchableRipple rippleColor={colors.accent} style={styles.rippleMarginTop} onPress={() => {}}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.flex}>
                    <Subheading>{i18n.t('settings.display.shareTitle')}</Subheading>
                    <Caption>{i18n.t('settings.display.shareDesc')}</Caption>
                  </View>
                  <Switch value={true} />
                </View>
              </TouchableRipple>
            </Surface>
            <Divider style={styles.divider} />
            <Surface style={styles.surfaceContainer}>
              <Paragraph style={{ color: colors.primary }}>{i18n.t('settings.menu.title')}</Paragraph>
              <Subheading>{i18n.t('settings.menu.desc')}</Subheading>
              {data ? renderEditableMenu() : <ActivityIndicator />}
            </Surface>
          </ScrollView>
        )}
      </SettingsContext.Consumer>
    </Surface>
  )
}
