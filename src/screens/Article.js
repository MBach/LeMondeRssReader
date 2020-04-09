import React, { useEffect, useState } from 'react'
import { Image, View, ScrollView } from 'react-native'
import { useTheme, Headline, Surface, Subheading, Paragraph, Title } from 'react-native-paper'

import { IconHome } from '../assets/Icons'

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
    //const par = main.querySelectorAll('p.article__paragraph')
    //d.par = par
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
    <Surface style={{ flex: 1, padding: 8 }}>
      <ScrollView>
        <Headline>{data.headLine}</Headline>
        <Subheading>{data.desc}</Subheading>
        <Paragraph>{data.authors}</Paragraph>
        <Paragraph>{data.date}</Paragraph>
        <View style={{ flexDirection: 'row' }}>
          <Image source={IconHome} style={{ width: 24, height: 24, tintColor: colors.text }} />
          <Paragraph>{data.readTime}</Paragraph>
        </View>
        {renderParagraphes()}
      </ScrollView>
    </Surface>
  )
}

export default ArticleScreen
