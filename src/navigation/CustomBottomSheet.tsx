import { useContext, useState, useEffect, useRef, useMemo } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme, Surface, Text, Chip, Divider, Portal, Dialog, Button } from 'react-native-paper'
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
  const [sections, setSections] = useState<{ title: string; data: MenuEntry[]; deletable: boolean }[]>([])
  const [showRemoveRecentDialog, setShowRemoveRecentDialog] = useState<MenuEntry | null>(null)
  const { width } = useWindowDimensions()
  const [chipContainerHeight, setChipContainerHeight] = useState(0)
  const chipStyle = useMemo(() => ({ maxWidth: width / 2.3 }), [width])
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
    },
    flexCenter: {
      justifyContent: 'center'
    }
  })

  const createSections = async (): Promise<{ title: string; data: MenuEntry[]; deletable: boolean }[]> => {
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
            subPath: subCat.subPath,
            isTranslatable: subCat.isTranslatable
          }
          const entries = allEntries.get(category.cat) ?? []
          entries.push(newMenuEntry)
          allEntries.set(category.cat, entries)
        }
      }
    }

    return [...allEntries.keys()].map((catName: string) => {
      const data = allEntries.get(catName) || []
      const first = data[0]
      if (catName === 'recent') {
        return {
          title: i18n.t('categories.recent', { count: lastCategories.length }),
          data,
          deletable: true
        }
      } else {
        return {
          title: first.isTranslatable ? i18n.t(`categories.${catName}`) : catName,
          data,
          deletable: false
        }
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
      snapPoints={[24, chipContainerHeight > 60 ? 150 : 110, '90%']}
      animateOnMount={false}
      enableOverDrag={false}
      enablePanDownToClose={false}>
      <BottomSheetScrollView>
        {sections.map((section, i: number) => (
          <Surface key={`section-${i}`} style={styles.hPadding}>
            <Text variant="titleMedium" style={styles.title}>
              {section.title}
            </Text>
            <View
              style={styles.section}
              onLayout={(event) => {
                if (i === 0) {
                  const { height } = event.nativeEvent.layout
                  setChipContainerHeight(height)
                }
              }}>
              {section.data.map((d: MenuEntry, j: number) => {
                const isSelected = settingsContext.currentCategory?.uri === d.uri
                if (section.deletable) {
                  return (
                    <Chip
                      compact
                      key={`section-${i}-subcat-${j}`}
                      mode={isSelected ? 'flat' : 'outlined'}
                      style={chipStyle}
                      elevated
                      selected={isSelected}
                      onPress={() => settingsContext.setCurrentCategory(d)}
                      onLongPress={() => setShowRemoveRecentDialog(d)}>
                      {d.isTranslatable ? i18n.t(`feeds.${d.name}`) : d.name}
                    </Chip>
                  )
                } else {
                  return (
                    <Chip
                      key={`section-${i}-subcat-${j}`}
                      mode={isSelected ? 'flat' : 'outlined'}
                      elevated
                      selected={isSelected}
                      onPress={() => settingsContext.setCurrentCategory(d)}>
                      {d.isTranslatable ? i18n.t(`feeds.${d.name}`) : d.name}
                    </Chip>
                  )
                }
              })}
            </View>
            <Divider style={styles.divider} />
          </Surface>
        ))}
        <Portal>
          <Dialog visible={showRemoveRecentDialog !== null} onDismiss={() => setShowRemoveRecentDialog(null)}>
            <Dialog.Actions style={styles.flexCenter}>
              <Button
                mode="text"
                onPress={async () => {
                  await settingsContext.removeCategory(showRemoveRecentDialog!)
                  setShowRemoveRecentDialog(null)
                }}>
                {i18n.t('sheet.removeRecent')}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}
