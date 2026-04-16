import { useCallback, useEffect, useRef, useState } from 'react'
import WebView from 'react-native-webview'

export function useWebViewAjaxPoll<T>(
  sourceUrl: string | null,
  getUrl: () => string | null,
  intervalMs: number,
  enabled: boolean
) {
  const webViewRef = useRef<WebView>(null)
  const [isReady, setIsReady] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const getUrlRef = useRef(getUrl)
  getUrlRef.current = getUrl

  const doPoll = useCallback(() => {
    const url = getUrlRef.current()
    if (!url) return
    console.log('[WebViewAjaxPoll] polling:', url)
    const js = `(function(){fetch(${JSON.stringify(url)},{credentials:'include'}).then(function(r){if(!r.ok){window.ReactNativeWebView.postMessage(JSON.stringify({__poll:1,err:r.status}));return;}return r.json().then(function(d){window.ReactNativeWebView.postMessage(JSON.stringify({__poll:1,d:d}));});}).catch(function(){window.ReactNativeWebView.postMessage(JSON.stringify({__poll:1,err:0}));});})();true;`
    webViewRef.current?.injectJavaScript(js)
  }, [])

  useEffect(() => {
    if (!isReady || !enabled) return
    doPoll()
    const id = setInterval(doPoll, intervalMs)
    return () => clearInterval(id)
  }, [isReady, enabled, intervalMs, doPoll])

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (!msg?.__poll) return
      if (msg.d !== undefined) {
        const created = Array.isArray(msg.d?.created) ? msg.d.created.length : 0
        const updated = Array.isArray(msg.d?.updated) ? msg.d.updated.length : 0
        console.log(`[WebViewAjaxPoll] ok — created: ${created}, updated: ${updated}`)
        setData(msg.d as T)
      } else {
        console.warn('[WebViewAjaxPoll] error, status:', msg.err)
      }
    } catch {}
  }, [])

  const onLoadEnd = useCallback(() => {
    console.log('[WebViewAjaxPoll] page ready, polling starts')
    setIsReady(true)
  }, [])

  return {
    data,
    webViewProps: sourceUrl
      ? {
          ref: webViewRef,
          source: { uri: sourceUrl },
          onMessage,
          onLoadEnd,
          javaScriptEnabled: true as const,
          domStorageEnabled: true as const,
          thirdPartyCookiesEnabled: true as const,
          style: { position: 'absolute' as const, width: 0, height: 0, opacity: 0 }
        }
      : null
  }
}
