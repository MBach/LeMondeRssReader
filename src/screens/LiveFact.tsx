import React, { useContext, useEffect, useState } from 'react'
import { useRoute } from '@react-navigation/native'
import { useWindowDimensions, Image, View, ScrollView, StatusBar, StyleSheet } from 'react-native'
import { ActivityIndicator, IconButton, Surface, Text } from 'react-native-paper'
import { SettingsContext } from '../context/SettingsContext'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 2.0
 */
export default function LiveFactScreen() {
  const route = useRoute()
  const settingsContext = useContext(SettingsContext)
  const [data, setData] = useState({ title: route.params?.item.title, description: route.params?.item.description })
  const [facts, setFacts] = useState([])
  const [loading, setLoading] = useState(false)
  const window = useWindowDimensions()

  const styles = StyleSheet.create({
    paddingH: {
      paddingHorizontal: 8
    },
    imageHeader: {
      width: window.width,
      height: 200,
      resizeMode: 'contain'
    }
  })

  useEffect(() => {
    init()
  }, [settingsContext.doc])

  const init = async () => {
    setLoading(true)
    if (!settingsContext.doc) {
      return
    }
    const facts = settingsContext.doc.querySelector('#post-container')
    let d = { ...data }
    let f = []
    for (let i = 0; i < facts.childNodes.length; i++) {
      const node = facts.childNodes[i]
      if (!node.tagName) {
        continue
      }
      switch (node.tagName.toLowerCase()) {
        case 'h2':
          if ('' !== node.text.trim()) f.push({ type: 'h2', text: node.text })
          break
        case 'p':
          f.push({ type: 'paragraph', text: node.text })
          break
        case 'ul':
          for (let j = 0; j < node.childNodes.length; j++) {
            f.push({ type: 'listItem', text: node.childNodes[j].text })
          }
          break
      }
    }
    setData(d)
    setFacts(f)
    setLoading(false)
  }

  const renderFacts = () => {
    return facts.map((f, index) => {
      switch (f.type) {
        case 'h2':
          return (
            <Text variant="titleLarge" key={index} style={styles.paddingH}>
              {f.text}
            </Text>
          )
        case 'paragraph':
          return (
            <Text variant="bodyMedium" key={index} style={styles.paddingH}>
              {f.text}
            </Text>
          )
        case 'listItem':
          return (
            <View key={index} style={{ flexDirection: 'row' }}>
              <IconButton icon="circle-medium" size={20} />
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {f.text}
              </Text>
            </View>
          )
        default:
          return false
      }
    })
  }

  return (
    <Surface style={{ flex: 1 }}>
      <ScrollView style={{ paddingTop: StatusBar.currentHeight }}>
        <Image source={route.params.item.uri ? { uri: route.params.item.uri } : DefaultImageFeed} style={styles.imageHeader} />
        <Text variant="headlineSmall" style={styles.paddingH}>
          {data.title}
        </Text>
        <Text variant="titleMedium" style={styles.paddingH}>
          {data.description}
        </Text>
        {loading ? <ActivityIndicator style={{ minHeight: 200, justifyContent: 'center', alignContent: 'center' }} /> : renderFacts()}
      </ScrollView>
    </Surface>
  )
}
