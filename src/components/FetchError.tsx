import { type FC } from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme, Text, IconButton, Button } from 'react-native-paper'

import { i18n } from '../locales/i18n'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center'
  },
  text: {
    textAlign: 'center'
  },
  button: {
    marginTop: 24,
    padding: 8
  }
})

interface FetchErrorProps {
  onRetry: () => void
}

export const FetchError: FC<FetchErrorProps> = ({ onRetry }) => {
  const { colors } = useTheme()
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" numberOfLines={2} style={styles.text}>
        {i18n.t('home.fetchFailed')}
      </Text>
      <IconButton icon="network-strength-1-alert" size={80} />
      <Button buttonColor={colors.secondary} textColor={colors.onSecondary} style={styles.button} onPress={onRetry}>
        {i18n.t('home.retry')}
      </Button>
    </View>
  )
}
