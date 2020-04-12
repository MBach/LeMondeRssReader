import { DefaultTheme, DarkTheme, Colors } from 'react-native-paper'
const { amberA400, amber500, indigo900 } = Colors

const darkTheme = {
  ...DarkTheme,
  roundness: 2,
  colors: {
    ...DarkTheme.colors,
    primary: amberA400,
    accent: amberA400,
    border: '#303030',
    divider: '#494949',
  },
}

const lightTheme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: indigo900,
    accent: amber500,
    border: '#f2f2f2',
    divider: '#f2f2f2',
  },
}

export { darkTheme, lightTheme }
