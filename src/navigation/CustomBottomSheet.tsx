import { useContext, useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme, Surface, Text, Chip, Divider } from 'react-native-paper'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'

import { SettingsContext } from '../context/SettingsContext'
import { useBottomSheet } from '../context/useBottomSheet'
import { i18n } from '../locales/i18n'
import { KEYS } from '../constants'
import { MenuEntry } from '../types'

export function CustomBottomSheet() {
  const settingsContext = useContext(SettingsContext)
  const { colors } = useTheme()
  const sheetRef = useBottomSheet()
  const [sections, setSections] = useState<{ title: string; data: MenuEntry[] }[]>([])

  const styles = StyleSheet.create({
    hPadding: {
      paddingHorizontal: 4
    },
    title: {
      textAlign: 'left',
      paddingBottom: 8
    },
    section: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 12,
      justifyContent: 'space-evenly'
    },
    divider: {
      marginBottom: 12
    }
  })

  const createSections = async () => {
    let allEntries = new Map<string, MenuEntry[]>()

    const lastCategoriesJSON = await AsyncStorage.getItem(KEYS.LAST_FIVE_CATEGORIES)
    const lastCategories: MenuEntry[] = lastCategoriesJSON ? JSON.parse(lastCategoriesJSON) : []

    if (lastCategories.length > 0) {
      allEntries.set('recent', lastCategories)
    }

    for (const category of settingsContext.feed) {
      for (const subCat of category.subCats) {
        if (subCat.active) {
          let newMenuEntry: MenuEntry = {
            cat: category.cat,
            name: subCat.name,
            uri: subCat.uri,
            subPath: subCat.subPath
          }
          let entries = allEntries.get(category.cat)
          if (!entries) {
            entries = []
          }
          entries.push(newMenuEntry)
          allEntries.set(category.cat, entries)
        }
      }
    }

    return [...allEntries.keys()].map((catName: string) => {
      const data = allEntries.get(catName)
      return {
        title: catName === 'recent' ? i18n.t('categories.recent', { count: lastCategories.length }) : i18n.t(`categories.${catName}`),
        data: data || []
      }
    })
  }

  useEffect(() => {
    const fetchSections = async () => {
      const sectionsData = await createSections()
      setSections(sectionsData)
    }

    if (settingsContext.hydrated) {
      fetchSections()
    }
  }, [settingsContext.hydrated, settingsContext.feed, settingsContext.lastFiveCategories])

  return (
    <BottomSheet
      ref={sheetRef}
      topInset={20}
      backgroundStyle={{ backgroundColor: colors.elevation.level1 }}
      handleIndicatorStyle={{ backgroundColor: colors.outline }}
      style={{ backgroundColor: 'transparent', paddingHorizontal: 8 }}
      index={0}
      snapPoints={[24, settingsContext.lastFiveCategories.length > 3 ? 150 : 110, '90%']}
      animateOnMount={false}
      enableOverDrag={false}
      enablePanDownToClose={false}>
      <BottomSheetScrollView>
        {sections.map((section, index: number) => (
          <Surface key={`section-${index}`} style={styles.hPadding}>
            <Text variant="titleMedium" style={styles.title}>
              {section.title}
            </Text>
            <View style={styles.section}>
              {section.data.map((d, idx) => {
                const isSelected = settingsContext.currentCategory?.uri === d.uri
                return (
                  <Chip
                    key={`subcat-${idx}`}
                    mode={isSelected ? 'flat' : 'outlined'}
                    elevated
                    selected={isSelected}
                    onPress={() => settingsContext.setCurrentCategory(d)}>
                    {i18n.t(`feeds.${d.name}`)}
                  </Chip>
                )
              })}
            </View>
            <Divider style={styles.divider} />
          </Surface>
        ))}
      </BottomSheetScrollView>
    </BottomSheet>
  )
}
