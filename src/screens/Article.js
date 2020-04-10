import React, { useEffect, useState } from 'react'
import { Image, View, ScrollView, Linking } from 'react-native'
import { useTheme, Headline, Surface, Subheading, Paragraph, Title, Card, Button } from 'react-native-paper'

import { IconTimer } from '../assets/Icons'
import i18n from '../locales/i18n'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function ArticleScreen({ content }) {
  const { colors } = useTheme()
  const [data, setData] = useState({})
  const [paragraphes, setParagraphes] = useState([])

  const main = content.querySelector('main')

  useEffect(() => {
    let d = {}
    // Header
    d.headLine = main.querySelector('h1').rawText
    d.desc = main.querySelector('p.article__desc').structuredText
    d.authors = main.querySelector('span.meta__author').rawText
    d.date = main.querySelector('span.meta__date').rawText
    d.readTime = main.querySelector('p.meta__reading-time').lastChild.rawText
    d.isRestricted = main.querySelector('p.article__status') !== null

    // Paragraphes and images
    const article = main.querySelector('article')
    let par = []
    for (let i = 0; i < article.childNodes.length; i++) {
      const node = article.childNodes[i]
      console.log(node.tagName)
      if (node.tagName) {
        console.log('node', node)
        switch (
          node.tagName
          //
        ) {
        }
      } else {
      }
      if (node && node.classNames && node.classNames.length > 0) {
        if (node.classNames.includes('article__paragraph')) {
          par.push({ type: 'paragraph', text: node.text })
        } else {
          const h2 = node.querySelector('h2')
          if (h2) {
            par.push({ type: 'h2', text: h2.text })
          } else {
            //const img = node.querySelectorAll('picture.article__media')
            //console.log('img', img)
          }
        }
      }
    }
    setData(d)
    setParagraphes(par)
  }, [])

  const renderParagraphes = () => {
    return paragraphes.map((p, index) => {
      switch (p.type) {
        case 'paragraph':
          return <Paragraph key={index}>{p.text}</Paragraph>
        case 'h2':
          return <Title key={index}>{p.text}</Title>
        default:
          return false
      }
    })
  }

  return (
    <Surface style={{ flex: 1, paddingHorizontal: 8 }}>
      <ScrollView>
        <Headline>{data.headLine}</Headline>
        <Subheading>{data.desc}</Subheading>
        <Paragraph>{data.authors}</Paragraph>
        <Paragraph>{data.date}</Paragraph>
        <View style={{ flexDirection: 'row' }}>
          <Image source={IconTimer} style={{ width: 24, height: 24, tintColor: colors.text, marginEnd: 8, marginBottom: 4 }} />
          <Paragraph>{data.readTime}</Paragraph>
        </View>
        {renderParagraphes()}
        {data.isRestricted && (
          <Card style={{ marginVertical: 8 }}>
            <Card.Content>
              <Paragraph>{i18n.t('article.restricted')}</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => Linking.openURL('https://abo.lemonde.fr/')}>
                {i18n.t('article.register')}
              </Button>
            </Card.Actions>
          </Card>
        )}
      </ScrollView>
    </Surface>
  )
}

export default ArticleScreen
