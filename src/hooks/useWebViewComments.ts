import { useCallback, useRef, useState } from 'react'
import { Comment } from '../types'

type Status = 'idle' | 'loading' | 'done' | 'error'

// Reads pageId from the page meta tag, then calls the feedbacks JSON API directly.
// Runs inside the WebView so session cookies are included automatically.
const COMMENTS_JS = `
(function() {
  function post(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'comments', data: data }));
  }
  function dbg(msg) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'debug', msg: msg }));
  }

  function fmt(iso) {
    var d = new Date(iso);
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
           ' - ' + pad(d.getHours()) + 'h' + pad(d.getMinutes());
  }

  function flatten(comments, level, parentName) {
    var result = [];
    (comments || []).forEach(function(c) {
      result.push({
        id: c.commentId,
        parentId: c.parentId || null,
        level: level,
        author: c.userName,
        date: fmt(c.publishedAt),
        content: c.content,
        likes: c.likes || 0,
        replyCount: (c.replies || []).length,
        repliedTo: parentName || null
      });
      if (c.replies && c.replies.length > 0) {
        result = result.concat(flatten(c.replies, level + 1, c.userName));
      }
    });
    return result;
  }

  var meta = document.querySelector('meta[property="ad:article_id"]') ||
             document.querySelector('meta[name="ad:article_id"]');
  var pageId = meta ? meta.getAttribute('content') : null;
  dbg('pageId:' + pageId);
  if (!pageId) { post([]); return; }

  fetch('https://www.lemonde.fr/ajax/feedbacks/page?pageId=' + pageId + '&page=1&limit=100&order=likes', {
    credentials: 'include'
  })
    .then(function(r) {
      dbg('status:' + r.status);
      return r.json();
    })
    .then(function(json) {
      dbg('comments:' + (json.comments || []).length);
      post(flatten(json.comments || [], 1, null));
    })
    .catch(function(e) {
      dbg('error:' + String(e));
      post([]);
    });
})();
true;
`

export function useWebViewComments() {
  const [status, setStatus] = useState<Status>('idle')
  const [comments, setComments] = useState<Comment[]>([])
  const [fetchUrl, setFetchUrl] = useState<string | null>(null)
  const doneRef = useRef(false)

  const fetch = useCallback((url: string) => {
    doneRef.current = false
    setComments([])
    setStatus('loading')
    setFetchUrl(url)
  }, [])

  const reset = useCallback(() => {
    doneRef.current = false
    setComments([])
    setStatus('idle')
    setFetchUrl(null)
  }, [])

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    if (doneRef.current) return
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (msg.kind === 'debug') {
        console.log('[WebViewComments]', msg.msg)
      } else if (msg.kind === 'comments') {
        doneRef.current = true
        setComments(msg.data as Comment[])
        setStatus('done')
      }
    } catch {
      // ignore non-JSON messages
    }
  }, [])

  const onError = useCallback(() => setStatus('error'), [])

  const webViewProps = fetchUrl
    ? {
        source: { uri: fetchUrl },
        injectedJavaScript: COMMENTS_JS,
        onMessage,
        onError,
        javaScriptEnabled: true as const,
        domStorageEnabled: true as const,
        thirdPartyCookiesEnabled: true as const,
        style: { width: 0, height: 0, opacity: 0, position: 'absolute' as const }
      }
    : null

  return { fetch, reset, comments, status, webViewProps }
}
