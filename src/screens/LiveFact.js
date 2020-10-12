import React, { useEffect, useState } from 'react'
import { useWindowDimensions, Image, View, ScrollView, StatusBar, StyleSheet } from 'react-native'
import { SharedElement } from 'react-navigation-shared-element'
import { ActivityIndicator, Headline, IconButton, Paragraph, Subheading, Surface, Title } from 'react-native-paper'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
export default function LiveFactScreen({ doc, route }) {
  const [data, setData] = useState({ title: route.params.item.title, description: route.params.item.description })
  const [facts, setFacts] = useState([])
  const [loading, setLoading] = useState(false)
  const window = useWindowDimensions()

  const styles = StyleSheet.create({
    paddingH: {
      paddingHorizontal: 8,
    },
    imageHeader: {
      width: window.width,
      height: 200,
      resizeMode: 'contain',
    },
  })

  useEffect(() => {
    init()
  }, [doc])

  const init = async () => {
    setLoading(true)
    if (!doc) {
      return
    }
    const facts = doc.querySelector('#js-facts-live')
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
            <Title key={index} style={styles.paddingH}>
              {f.text}
            </Title>
          )
        case 'paragraph':
          return (
            <Paragraph key={index} style={styles.paddingH}>
              {f.text}
            </Paragraph>
          )
        case 'listItem':
          return (
            <View key={index} style={{ flexDirection: 'row' }}>
              <IconButton icon="circle-medium" size={20} />
              <Paragraph style={{ flex: 1 }}>{f.text}</Paragraph>
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
        <SharedElement id={`item.${route.params.item.id}.photo`}>
          <Image source={route.params.item.uri ? { uri: route.params.item.uri } : DefaultImageFeed} style={styles.imageHeader} />
        </SharedElement>
        <Headline style={styles.paddingH}>{data.title}</Headline>
        <Subheading style={styles.paddingH}>{data.description}</Subheading>
        {loading ? <ActivityIndicator style={{ minHeight: 200, justifyContent: 'center', alignContent: 'center' }} /> : renderFacts()}
      </ScrollView>
    </Surface>
  )
}
