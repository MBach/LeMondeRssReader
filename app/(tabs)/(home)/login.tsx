import { LoginScreen } from '@/src/screens/Login'
import { useLocalSearchParams } from 'expo-router'

export default function LoginRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>()
  return <LoginScreen mode={mode === 'logout' ? 'logout' : 'login'} />
}
