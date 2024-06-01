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

const defaultImplementation: DynamicNavbarInterface = {
  setLightNavigationBar: (): Promise<void> => {
    console.warn('DynamicNavbar > setLightNavigationBar: not implemented')
    return Promise.resolve()
  },
  setKeepScreenOn: (): Promise<void> => {
    console.warn('DynamicNavbar > setKeepScreenOn: not implemented')
    return Promise.resolve()
  }
}

let DynamicNavbar: DynamicNavbarInterface

if (Platform.OS === 'android') {
  const { DynamicNavbarModule } = NativeModules
  if (DynamicNavbarModule) {
    const { setLightNavigationBar, setKeepScreenOn } = DynamicNavbarModule
    DynamicNavbar = { setLightNavigationBar, setKeepScreenOn }
  } else {
    DynamicNavbar = defaultImplementation
  }
} else {
  DynamicNavbar = defaultImplementation
}

export default DynamicNavbar
