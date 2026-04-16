import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useEffect } from 'react'

export function useKeepScreenOn(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      void activateKeepAwakeAsync()
    } else {
      void deactivateKeepAwake()
    }
    return () => { void deactivateKeepAwake() }
  }, [enabled])
}
