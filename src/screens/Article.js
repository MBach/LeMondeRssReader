import React, { useEffect, useState } from 'react'
import { Text, View, ScrollView } from 'react-native'
import { Title, Surface } from 'react-native-paper'
/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function ArticleScreen({ navigation, content }) {
  const [title, setTitle] = useState()

  useEffect(() => {
    const h1 = content.documentElement.getElementsByTagName('h1')
    if (h1 && h1.length > 0) {
      setTitle(h1[0].textContent)
    }
  }, [])

  return (
    <Surface style={{ flex: 1, padding: 8 }}>
      <ScrollView>
        <Title>{title}</Title>
      </ScrollView>
    </Surface>
  )
}

export default ArticleScreen
