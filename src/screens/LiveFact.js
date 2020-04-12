import React, { useEffect, useState } from 'react'
import { Image, View, ScrollView, StyleSheet, Linking } from 'react-native'
import { useTheme, ActivityIndicator, Headline, Surface, Subheading, Paragraph, Title, Card, Button } from 'react-native-paper'
import { SharedElement } from 'react-navigation-shared-element'
import ky from 'ky'
import { parse } from 'node-html-parser'

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
function LiveFactScreen({ item }) {
  const { colors } = useTheme()
  const [data, setData] = useState({ title: item.title, description: item.description })
  const [facts, setFacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    setLoading(true)
    const response = await ky.get(item.link)
    const doc = parse(await response.text())
    const facts = doc.querySelector('#js-facts-live')

    let d = { ...data }
    let f = []

    for (let i = 0; i < facts.childNodes.length; i++) {
      const node = facts.childNodes[i]
      //console.log(node.tagName)
      if (node.tagName) {
        //console.log('node', node)
        switch (
          node.tagName
          //
        ) {
        }
      } else {
      }
    }
    setData(d)
    setFacts(f)
    setLoading(false)
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
          <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignContent: 'center', height: '100%' }} />
        ) : (
          <>
            <View style={{ ...styles.paddingH, flexDirection: 'row' }}></View>
          </>
        )}
      </ScrollView>
    </Surface>
  )
}

export default LiveFactScreen
