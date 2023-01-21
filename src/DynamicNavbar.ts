import { NativeModules, Platform } from 'react-native'

/**
 * @author Matthieu BACHELIER
 * @since 2020-04
 * @version 2.0
 */
interface DynamicNavbarInterface {
  setLightNavigationBar: (isLight: boolean) => Promise<void>
  setKeepScreenOn: (isOn: boolean) => Promise<void>
}

declare module 'react-native' {
  interface NativeModulesStatic {
    DynamicNavbarModule: DynamicNavbarInterface
  }
}

let DynamicNavbar: DynamicNavbarInterface
if (Platform.OS === 'android') {
  const { DynamicNavbarModule } = NativeModules
  const { setLightNavigationBar, setKeepScreenOn } = DynamicNavbarModule
  DynamicNavbar = { setLightNavigationBar, setKeepScreenOn }
} else {
  const setLightNavigationBar = (): Promise<void> => {
    console.warn('DynamicNavbar > setLightNavigationBar: not implemented')
    return new Promise(() => {})
  }
  const setKeepScreenOn = (): Promise<void> => {
    console.warn('DynamicNavbar > setKeepScreenOn: not implemented')
    return new Promise(() => {})
  }
  DynamicNavbar = { setLightNavigationBar, setKeepScreenOn }
}

export default DynamicNavbar
