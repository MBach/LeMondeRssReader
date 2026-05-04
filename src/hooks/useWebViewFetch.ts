import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_TIMEOUT_MS = 20_000

const INJECTED_JS = `
(function() {
  var POLL_INTERVAL = 300;
  var start = Date.now();

  function post(payload) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }

  function isReady(container) {
    var svg = container.querySelector('svg');
    if (!svg) return false;
    if (svg.querySelectorAll('path').length < 10) return false;
    var path = svg.querySelector('path');
    var fill = path ? getComputedStyle(path).fill : '';
    // 'none' is a valid fill (e.g. AOM borders); we just need it computed
    return fill && fill !== '';
  }

  function hideTooltips(container) {
    container.querySelectorAll('[class*="d_tooltip_"]').forEach(function(el) {
      el.style.display = 'none';
    });
  }

  function postHtmlAndDone() {
    post({ kind: 'html', data: document.documentElement.outerHTML });
    post({ kind: 'done' });
  }

  function start_() {
    var a = 0;
    (function pollReactions() {
      var found = !!document.querySelector('[data-trigger="comments-popin"]');
      if (found || a++ >= 10) {
        postHtmlAndDone();
      } else {
        setTimeout(pollReactions, 300);
      }
    })();
  }

  if (document.readyState === 'complete') {
    start_();
  } else {
    window.addEventListener('load', start_);
  }
})();
true;
`

type Status = 'idle' | 'loading' | 'done' | 'error'

type Options = {
  timeoutMs?: number
}

export function useWebViewFetch(options: Options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const [fetchUrl, setFetchUrl] = useState<string | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  const doneReceivedRef = useRef(false)
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
    doneReceivedRef.current = false
  }, [])

  useFocusEffect(
    useCallback(() => {
      return abort
    }, [abort])
  )

  useEffect(() => {
    if (!fetchUrl) return
    timeoutRef.current = setTimeout(() => {
      setFetchUrl(null)
      setStatus('error')
    }, timeoutMs)
    return clearTimer
  }, [fetchUrl, timeoutMs])

  const fetch = useCallback((url: string) => {
    console.log('[WebViewFetch] starting fetch:', url)
    doneReceivedRef.current = false
    setHtml(null)
    setStatus('loading')
    setFetchUrl(url)
  }, [])

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    if (doneReceivedRef.current) {
      console.log('[WebViewFetch] message after done ignored')
      return
    }
    let payload: any
    try {
      payload = JSON.parse(event.nativeEvent.data)
    } catch {
      // Legacy/raw HTML fallback (defensive — shouldn't happen with new INJECTED_JS)
      doneReceivedRef.current = true
      clearTimer()
      setFetchUrl(null)
      setHtml(event.nativeEvent.data)
      setStatus('done')
      return
    }

    switch (payload.kind) {
      case 'html':
        console.log('[WebViewFetch] HTML received, length:', payload.data?.length)
        setHtml(payload.data)
        break
      case 'done':
        console.log('[WebViewFetch] done')
        doneReceivedRef.current = true
        clearTimer()
        setFetchUrl(null)
        setStatus('done')
        break
    }
  }, [])

  const onError = useCallback(() => {
    console.warn('[WebViewFetch] WebView error')
    if (doneReceivedRef.current) return
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
    webViewProps: fetchUrl
      ? {
          source: { uri: fetchUrl },
          injectedJavaScript: INJECTED_JS,
          onMessage,
          onError,
          javaScriptEnabled: true as const,
          domStorageEnabled: true as const,
          thirdPartyCookiesEnabled: true as const,
          style: { position: 'absolute' as const, width: 0, height: 0, opacity: 0 }
        }
      : null
  }
}
