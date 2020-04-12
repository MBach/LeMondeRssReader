import { NativeModules } from 'react-native'

const { DynamicNavbarModule } = NativeModules
const { setLightNavigationBar } = DynamicNavbarModule
const DynamicNavbar = { setLightNavigationBar }

export default DynamicNavbar
