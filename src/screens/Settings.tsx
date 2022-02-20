import React, { useContext, useEffect, useState } from 'react'
import { Appearance, ScrollView, StyleSheet, StatusBar, View } from 'react-native'
import {
  useTheme,
  ActivityIndicator,
  Chip,
  Divider,
  Surface,
  Switch,
  Text,
  TouchableRipple,
  Portal,
  Dialog,
  Button,
  RadioButton
} from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { KEYS } from '../constants'
import { SettingsContext } from '../context/SettingsContext'
import { UseSettingsType } from '../context/useSettings'
import i18n from '../locales/i18n'
import { Category } from '../types'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export default function SettingsScreen() {
  const settingsContext = useContext(SettingsContext)

  const [data, setData] = useState<Category[]>([])
  const [showThemeDialog, setShowThemeDialog] = useState<boolean>(false)
  const [radioValue, setRadioValue] = useState<'light' | 'dark' | 'system'>('system')

  const { colors } = useTheme()

  const styles = StyleSheet.create({
    flex: {
      flex: 1
    },
    surfaceContainer: {
      padding: 16
    },
    rippleMarginTop: {
      marginTop: 16
    },
    chipContainer: {
      flex: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginLeft: -2,
      marginBottom: 8
    },
    catChip: {
      marginVertical: 4
    },
    chip: {
      marginHorizontal: 2,
      marginBottom: 8
    }
  })

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    setData(settingsContext.feed)
  }

  const toogleItem = (idxCat: number, idxFeed: number) => () => {
    let d = [...data]
    let o = d[idxCat].subCats[idxFeed]
    o.active = !o.active
    setData(d)
    settingsContext.setFeed(d)
  }

  const renderEditableMenu = () => {
    let items: any[] = []
    data.map((d: Category, index: number) => {
      items.push(
        <Text variant="bodySmall" key={`cat-${index}`} style={styles.catChip}>
          {i18n.t(`categories.${d.cat}`)}
        </Text>
      )
      items.push(
        <View key={`feeds-${index}`} style={styles.chipContainer}>
          {d.subCats.map((feed, idxFeed) => (
            <Chip
              key={idxFeed}
              selected={feed.active}
              selectedColor={feed.active ? colors.primary : colors.outline}
              style={styles.chip}
              onPress={toogleItem(index, idxFeed)}>
              {i18n.t(`feeds.${feed.name}`)}
            </Chip>
          ))}
        </View>
      )
    })
    return items
  }

  const changeTheme = (newTheme: string) => {
    setRadioValue(newTheme as 'light' | 'dark' | 'system')
    if (newTheme === 'system') {
      const colorScheme = Appearance.getColorScheme()
      settingsContext.setTheme(colorScheme ?? 'light')
      AsyncStorage.removeItem(KEYS.THEME)
    } else {
      settingsContext.setTheme(newTheme as 'light' | 'dark')
      AsyncStorage.setItem(KEYS.THEME, newTheme)
    }
    setShowThemeDialog(false)
  }

  return (
    <Surface style={{ flex: 1 }}>
      <StatusBar translucent />
      <SettingsContext.Consumer>
        {(settingsContext: UseSettingsType) => (
          <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
            <Surface style={styles.surfaceContainer}>
              <Text variant="bodyMedium" style={{ color: colors.primary }}>
                {i18n.t('settings.general.title')}
              </Text>
              <TouchableRipple
                rippleColor={colors.primary}
                style={styles.rippleMarginTop}
                onPress={() => settingsContext.setKeepLastSection(!settingsContext.keepLastSection)}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.general.content1')}</Text>
                    <Text variant="bodyMedium">{i18n.t('settings.general.desc1')}</Text>
                  </View>
                  <Switch value={settingsContext.keepLastSection} onValueChange={settingsContext.setKeepLastSection} />
                </View>
              </TouchableRipple>
            </Surface>
            <Divider />
            <Surface style={styles.surfaceContainer}>
              <Text variant="bodyMedium" style={{ color: colors.primary }}>
                {i18n.t('settings.layout.title')}
              </Text>
              <TouchableRipple rippleColor={colors.primary} style={styles.rippleMarginTop}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.layout.content1')}</Text>
                    <Text variant="bodyMedium">{i18n.t('settings.layout.desc1')}</Text>
                  </View>
                  <Switch value={true} disabled />
                </View>
              </TouchableRipple>
            </Surface>
            <Divider />
            <Surface style={styles.surfaceContainer}>
              <Text variant="bodyMedium" style={{ color: colors.primary }}>
                {i18n.t('settings.display.title')}
              </Text>
              <TouchableRipple rippleColor={colors.primary} style={styles.rippleMarginTop} onPress={() => setShowThemeDialog(true)}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.display.theme.title')}</Text>
                    <Text>{i18n.t('settings.display.theme.currentTheme', { theme: i18n.t(`settings.display.theme.${radioValue}`) })}</Text>
                  </View>
                </View>
              </TouchableRipple>
              <TouchableRipple
                rippleColor={colors.primary}
                style={styles.rippleMarginTop}
                onPress={() => settingsContext.setShare(!settingsContext.share)}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.display.shareTitle')}</Text>
                    <Text variant="bodySmall">{i18n.t('settings.display.shareDesc')}</Text>
                  </View>
                  <Switch value={settingsContext.share} onValueChange={settingsContext.setShare} />
                </View>
              </TouchableRipple>
              <TouchableRipple
                rippleColor={colors.primary}
                style={styles.rippleMarginTop}
                onPress={() => settingsContext.setDynamicStatusBarColor(!settingsContext.hasDynamicStatusBarColor)}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.display.premiumColorTitle')}</Text>
                    <Text variant="bodySmall">{i18n.t('settings.display.premiumColorDesc')}</Text>
                  </View>
                  <Switch value={settingsContext.hasDynamicStatusBarColor} onValueChange={settingsContext.setDynamicStatusBarColor} />
                </View>
              </TouchableRipple>
            </Surface>
            <Divider />
            <Surface style={styles.surfaceContainer}>
              <Text variant="bodyMedium" style={{ color: colors.primary }}>
                {i18n.t('settings.menu.title')}
              </Text>
              <Text variant="titleMedium">{i18n.t('settings.menu.desc')}</Text>
              {data.length > 0 ? renderEditableMenu() : <ActivityIndicator />}
            </Surface>
          </ScrollView>
        )}
      </SettingsContext.Consumer>
      <Portal>
        <Dialog visible={showThemeDialog} onDismiss={() => setShowThemeDialog(false)}>
          <Dialog.Title>{i18n.t('settings.display.theme.title')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={changeTheme} value={radioValue}>
              <RadioButton.Item
                label={i18n.t('settings.display.theme.light')}
                accessibilityLabel={i18n.t('settings.a11y.theme.light')}
                value="light"
                position="leading"
                labelStyle={{
                  textAlign: 'left'
                }}
              />
              <RadioButton.Item
                label={i18n.t('settings.display.theme.dark')}
                accessibilityLabel={i18n.t('settings.a11y.theme.dark')}
                value="dark"
                position="leading"
                labelStyle={{
                  textAlign: 'left'
                }}
              />
              <RadioButton.Item
                label={i18n.t('settings.display.theme.system2')}
                accessibilityLabel={i18n.t('settings.a11y.theme.system')}
                value="system"
                position="leading"
                labelStyle={{
                  textAlign: 'left'
                }}
              />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowThemeDialog(false)}>Annuler</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  )
}
