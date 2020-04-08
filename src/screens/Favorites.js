import React, { useEffect } from 'react'
import { Surface, Text } from 'react-native-paper'

/**
 * @author Matthieu BACHELIER
 * @since 2020-03
 * @version 1.0
 */
function FavScreen({ navigation }) {
  useEffect(() => {
    if (false) {
      //
    }
  }, [])

  return (
    <Surface
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Mes favoris</Text>
    </Surface>
  )
}

export default FavScreen
