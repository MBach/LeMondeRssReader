import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper'

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    primary: 'rgb(120, 89, 0)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(255, 223, 158)',
    onPrimaryContainer: 'rgb(38, 26, 0)',
    secondary: 'rgb(107, 93, 63)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(245, 224, 187)',
    onSecondaryContainer: 'rgb(36, 26, 4)',
    tertiary: 'rgb(83, 95, 112)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(215, 227, 248)',
    onTertiaryContainer: 'rgb(16, 28, 43)',
    error: 'rgb(186, 26, 26)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 218, 214)',
    onErrorContainer: 'rgb(65, 0, 2)',
    background: 'rgb(255, 251, 255)',
    onBackground: 'rgb(30, 27, 22)',
    surface: 'rgb(255, 251, 255)',
    onSurface: 'rgb(30, 27, 22)',
    surfaceVariant: 'rgb(237, 225, 207)',
    onSurfaceVariant: 'rgb(77, 70, 57)',
    outline: 'rgb(127, 118, 103)',
    outlineVariant: 'rgb(208, 197, 180)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(51, 48, 42)',
    inverseOnSurface: 'rgb(247, 239, 231)',
    inversePrimary: 'rgb(250, 189, 0)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(248, 243, 242)',
      level2: 'rgb(244, 238, 235)',
      level3: 'rgb(240, 233, 227)',
      level4: 'rgb(239, 232, 224)',
      level5: 'rgb(236, 228, 219)'
    },
    surfaceDisabled: 'rgba(30, 27, 22, 0.12)',
    onSurfaceDisabled: 'rgba(30, 27, 22, 0.38)',
    backdrop: 'rgba(54, 48, 36, 0.4)'
  }
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    primary: 'rgb(250, 189, 0)',
    onPrimary: 'rgb(63, 46, 0)',
    primaryContainer: 'rgb(91, 67, 0)',
    onPrimaryContainer: 'rgb(255, 223, 158)',
    secondary: 'rgb(216, 196, 160)',
    onSecondary: 'rgb(58, 47, 21)',
    secondaryContainer: 'rgb(82, 69, 42)',
    onSecondaryContainer: 'rgb(245, 224, 187)',
    tertiary: 'rgb(187, 199, 219)',
    onTertiary: 'rgb(38, 49, 65)',
    tertiaryContainer: 'rgb(60, 72, 88)',
    onTertiaryContainer: 'rgb(215, 227, 248)',
    error: 'rgb(255, 180, 171)',
    onError: 'rgb(105, 0, 5)',
    errorContainer: 'rgb(147, 0, 10)',
    onErrorContainer: 'rgb(255, 180, 171)',
    background: 'rgb(30, 27, 22)',
    onBackground: 'rgb(233, 225, 216)',
    surface: 'rgb(30, 27, 22)',
    onSurface: 'rgb(233, 225, 216)',
    surfaceVariant: 'rgb(77, 70, 57)',
    onSurfaceVariant: 'rgb(208, 197, 180)',
    outline: 'rgb(153, 143, 128)',
    outlineVariant: 'rgb(77, 70, 57)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(233, 225, 216)',
    inverseOnSurface: 'rgb(51, 48, 42)',
    inversePrimary: 'rgb(120, 89, 0)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(41, 35, 21)',
      level2: 'rgb(48, 40, 20)',
      level3: 'rgb(54, 45, 20)',
      level4: 'rgb(56, 46, 19)',
      level5: 'rgb(61, 50, 19)'
    },
    surfaceDisabled: 'rgba(233, 225, 216, 0.12)',
    onSurfaceDisabled: 'rgba(233, 225, 216, 0.38)',
    backdrop: 'rgba(54, 48, 36, 0.4)'
  }
}

export const KEYS = {
  DYNAMIC_STATUSBAR_COLOR: 'dynamicStatusBarColor',
  FAVORITES: 'favorites',
  FEED: 'feed',
  KEEP_LAST_SECTION: 'keepLastSection',
  LAST_SECTION_ENTRY: 'lastSectionEntry',
  SHARE: 'share',
  THEME: 'theme'
}
