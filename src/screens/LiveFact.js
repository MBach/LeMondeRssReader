import React, { useEffect, useState } from 'react'
import { Image, View, ScrollView, StyleSheet } from 'react-native'
import { SharedElement } from 'react-navigation-shared-element'
import { ActivityIndicator, Headline, IconButton, Paragraph, Subheading, Surface, Title } from 'react-native-paper'

const styles = StyleSheet.create({
  paddingH: {
    paddingHorizontal: 8,
  },
  imageHeader: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
})

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function LiveFactScreen({ doc, item }) {
  const [data, setData] = useState({ title: item.title, description: item.description })
  const [facts, setFacts] = useState([])
  const [loading, setLoading] = useState(false)

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
      if (node.tagName) {
        switch (node.tagName) {
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
      <ScrollView>
        <SharedElement id={`item.${item.id}.photo`}>
          <Image source={item.uri ? { uri: item.uri } : DefaultImageFeed} style={styles.imageHeader} />
        </SharedElement>
        <Headline style={styles.paddingH}>{data.title}</Headline>
        <Subheading style={styles.paddingH}>{data.description}</Subheading>
        {loading ? (
          <ActivityIndicator style={{ flex: 1, flexGrow: 1, justifyContent: 'center', alignContent: 'center' }} />
        ) : (
          <>{renderFacts()}</>
        )}
      </ScrollView>
    </Surface>
  )
}

export default LiveFactScreen
