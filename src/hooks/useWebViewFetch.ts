import { useNavigation } from '@react-navigation/native'
import { useCallback, useEffect, useRef, useState } from 'react'

const TIMEOUT_MS = 10_000

const INJECTED_JS = `
  (function() {
    function extract() {
      window.ReactNativeWebView.postMessage(document.documentElement.outerHTML)
    }
    if (document.readyState === 'complete') {
      extract()
    } else {
      window.addEventListener('load', extract)
    }
  })();
  true;
`

type Status = 'idle' | 'loading' | 'done' | 'error'

export function useWebViewFetch() {
  const navigation = useNavigation()
  const [fetchUrl, setFetchUrl] = useState<string | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  const htmlReceivedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const abort = useCallback(() => {
    clearTimer()
    setFetchUrl(null)
    htmlReceivedRef.current = false
  }, [])

  // Unmount WebView if user navigates away
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', abort)
    return unsubscribe
  }, [navigation, abort])

  // Start timeout when fetchUrl is set
  useEffect(() => {
    if (!fetchUrl) return
    timeoutRef.current = setTimeout(() => {
      console.warn('[WebViewFetch] timed out after', TIMEOUT_MS, 'ms')
      setFetchUrl(null)
      setStatus('error')
    }, TIMEOUT_MS)
    return clearTimer
  }, [fetchUrl])

  const fetch = useCallback((url: string) => {
    console.log('[WebViewFetch] starting fetch:', url)
    htmlReceivedRef.current = false
    setHtml(null)
    setStatus('loading')
    setFetchUrl(url)
  }, [])

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    if (htmlReceivedRef.current) {
      console.log('[WebViewFetch] duplicate onMessage ignored')
      return
    }
    console.log('[WebViewFetch] HTML received, length:', event.nativeEvent.data.length)
    htmlReceivedRef.current = true
    clearTimer()
    setFetchUrl(null)
    setHtml(event.nativeEvent.data)
    setStatus('done')
  }, [])

  const onError = useCallback(() => {
    console.warn('[WebViewFetch] WebView error')
    if (htmlReceivedRef.current) return
    clearTimer()
    setFetchUrl(null)
    setStatus('error')
  }, [])

  const reset = useCallback(() => {
    abort()
    setHtml(null)
    setStatus('idle')
  }, [abort])

  return {
    fetch,
    reset,
    html,
    status,
    // Spread these directly onto your <WebView> when fetchUrl is set
    webViewProps: fetchUrl
      ? {
          source: { uri: fetchUrl },
          injectedJavaScript: INJECTED_JS,
          onMessage,
          onError,
          javaScriptEnabled: true as const,
          domStorageEnabled: true as const,
          thirdPartyCookiesEnabled: true as const,
          style: { width: 0, height: 0, opacity: 0 }
        }
      : null
  }
}
