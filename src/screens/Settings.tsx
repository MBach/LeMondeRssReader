import { useContext, useState } from 'react'
import { ScrollView, StyleSheet, StatusBar, View } from 'react-native'
import {
  useTheme,
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  Divider,
  Portal,
  RadioButton,
  Switch,
  Text,
  TouchableRipple,
  Surface
} from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { KEYS } from '../constants'
import { SettingsContext } from '../context/SettingsContext'
import { UseSettingsType } from '../context/useSettings'
import { i18n } from '../locales/i18n'
import { Category, Theme } from '../types'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export function SettingsScreen() {
  const settingsContext = useContext(SettingsContext)

  const [data, setData] = useState<Category[]>(settingsContext.feed)
  const [showThemeDialog, setShowThemeDialog] = useState<boolean>(false)
  const [radioValue, setRadioValue] = useState<Theme>(settingsContext.theme)

  const { colors } = useTheme()

  const styles = StyleSheet.create({
    flex: {
      flex: 1
    },
    flexRow: {
      flexDirection: 'row'
    },
    surfaceContainer: {
      paddingHorizontal: 8,
      paddingVertical: 16
    },
    rippleMarginTop: {
      marginTop: 16
    },
    chipContainer: {
      flex: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 24,
      gap: 8
    },
    catChip: {
      marginVertical: 4
    }
  })

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
              onPress={toogleItem(index, idxFeed)}
              textStyle={{ minWidth: 70 }}>
              {i18n.t(`feeds.${feed.name}`)}
            </Chip>
          ))}
        </View>
      )
    })
    return items
  }

  const changeTheme = (newTheme: Theme) => {
    setRadioValue(newTheme)
    settingsContext.setTheme(newTheme)
    AsyncStorage.setItem(KEYS.THEME, newTheme)
    setShowThemeDialog(false)
  }

  return (
    <Surface elevation={0} style={{ flex: 1 }}>
      <StatusBar translucent />
      <SettingsContext.Consumer>
        {(settingsContext: UseSettingsType) => (
          <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
            <View style={styles.surfaceContainer}>
              <Text variant="bodyMedium" style={{ color: colors.primary }}>
                {i18n.t('settings.general.title')}
              </Text>
              <TouchableRipple
                rippleColor={colors.primary}
                style={styles.rippleMarginTop}
                onPress={() => settingsContext.setKeepLastSection(!settingsContext.keepLastSection)}>
                <View style={styles.flexRow}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.general.content1')}</Text>
                    <Text variant="bodyMedium">{i18n.t('settings.general.desc1')}</Text>
                  </View>
                  <Switch value={settingsContext.keepLastSection} onValueChange={settingsContext.setKeepLastSection} />
                </View>
              </TouchableRipple>
              <TouchableRipple
                rippleColor={colors.primary}
                style={styles.rippleMarginTop}
                onPress={() => settingsContext.setKeepScreenOn(!settingsContext.keepScreenOn)}>
                <View style={styles.flexRow}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.general.content2')}</Text>
                    <Text variant="bodyMedium">{i18n.t('settings.general.desc2')}</Text>
                  </View>
                  <Switch value={settingsContext.keepScreenOn} onValueChange={settingsContext.setKeepScreenOn} />
                </View>
              </TouchableRipple>
            </View>
            <Divider />
            <View style={styles.surfaceContainer}>
              <Text variant="bodyMedium" style={{ color: colors.primary }}>
                {i18n.t('settings.layout.title')}
              </Text>
              <TouchableRipple rippleColor={colors.primary} style={styles.rippleMarginTop}>
                <View style={styles.flexRow}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.layout.content1')}</Text>
                    <Text variant="bodyMedium">{i18n.t('settings.layout.desc1')}</Text>
                  </View>
                  <Switch value={true} disabled />
                </View>
              </TouchableRipple>
              <TouchableRipple
                rippleColor={colors.primary}
                style={styles.rippleMarginTop}
                onPress={() => settingsContext.setReadAlso(!settingsContext.hasReadAlso)}>
                <View style={styles.flexRow}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.layout.content2')}</Text>
                    <Text variant="bodyMedium">{i18n.t('settings.layout.desc2')}</Text>
                  </View>
                  <Switch value={settingsContext.hasReadAlso} onValueChange={settingsContext.setReadAlso} />
                </View>
              </TouchableRipple>
            </View>
            <Divider />
            <View style={styles.surfaceContainer}>
              <Text variant="bodyMedium" style={{ color: colors.primary }}>
                {i18n.t('settings.display.title')}
              </Text>
              <TouchableRipple rippleColor={colors.primary} style={styles.rippleMarginTop} onPress={() => setShowThemeDialog(true)}>
                <View style={styles.flexRow}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.display.theme.title')}</Text>
                    <Text>
                      {i18n.t('settings.display.theme.currentTheme', { theme: i18n.t(`settings.display.theme.${settingsContext.theme}`) })}
                    </Text>
                  </View>
                </View>
              </TouchableRipple>
              <TouchableRipple
                rippleColor={colors.primary}
                style={styles.rippleMarginTop}
                onPress={() => settingsContext.setShare(!settingsContext.share)}>
                <View style={styles.flexRow}>
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
                <View style={styles.flexRow}>
                  <View style={styles.flex}>
                    <Text variant="titleMedium">{i18n.t('settings.display.premiumColorTitle')}</Text>
                    <Text variant="bodySmall">{i18n.t('settings.display.premiumColorDesc')}</Text>
                  </View>
                  <Switch value={settingsContext.hasDynamicStatusBarColor} onValueChange={settingsContext.setDynamicStatusBarColor} />
                </View>
              </TouchableRipple>
            </View>
            <Divider />
            <View style={styles.surfaceContainer}>
              <Text variant="bodyMedium" style={{ color: colors.primary }}>
                {i18n.t('settings.menu.title')}
              </Text>
              <Text variant="titleMedium">{i18n.t('settings.menu.desc')}</Text>
              {data.length > 0 ? renderEditableMenu() : <ActivityIndicator />}
            </View>
          </ScrollView>
        )}
      </SettingsContext.Consumer>
      <Portal>
        <Dialog visible={showThemeDialog} onDismiss={() => setShowThemeDialog(false)}>
          <Dialog.Title>{i18n.t('settings.display.theme.title')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(themeStr) => changeTheme(themeStr as Theme)} value={radioValue}>
              <RadioButton.Item
                label={i18n.t('settings.display.theme.light')}
                accessibilityLabel={i18n.t('settings.a11y.theme.light')}
                value={Theme.LIGHT}
                position="leading"
                labelStyle={{
                  textAlign: 'left'
                }}
              />
              <RadioButton.Item
                label={i18n.t('settings.display.theme.dark')}
                accessibilityLabel={i18n.t('settings.a11y.theme.dark')}
                value={Theme.DARK}
                position="leading"
                labelStyle={{
                  textAlign: 'left'
                }}
              />
              <RadioButton.Item
                label={i18n.t('settings.display.theme.system2')}
                accessibilityLabel={i18n.t('settings.a11y.theme.system')}
                value={Theme.SYSTEM}
                position="leading"
                labelStyle={{
                  textAlign: 'left'
                }}
              />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowThemeDialog(false)}>{i18n.t('settings.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  )
}
