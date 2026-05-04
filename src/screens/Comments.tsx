import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native'
import { Appbar, Divider, Surface, Text, useTheme } from 'react-native-paper'
import WebView from 'react-native-webview'

import { useWebViewComments } from '../hooks/useWebViewComments'
import { i18n } from '../locales/i18n'
import { Comment } from '../types'
import { commentCache } from '../utils/commentCache'

const INDENT = 20

// 12 perceptually distinct hues, evenly distributed around the wheel
const HUES = [4, 34, 54, 104, 139, 174, 199, 219, 254, 284, 319, 349]

function hashUsername(name: string): number {
  let h = 5381
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) & 0x7fffffff
  return h
}

function avatarColors(name: string, dark: boolean): { bg: string; fg: string } {
  const hue = HUES[hashUsername(name) % HUES.length]
  return dark ? { bg: `hsl(${hue},40%,28%)`, fg: `hsl(${hue},80%,82%)` } : { bg: `hsl(${hue},55%,88%)`, fg: `hsl(${hue},65%,22%)` }
}

function CommentItem({ item }: { item: Comment }) {
  const { colors, dark } = useTheme()
  const avatar = avatarColors(item.author, dark)

  const styles = StyleSheet.create({
    row: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingLeft: 16 + (item.level - 1) * INDENT
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: avatar.bg,
      justifyContent: 'center',
      alignItems: 'center'
    },
    initial: {
      color: avatar.fg,
      fontWeight: 'bold',
      fontSize: 14
    },
    meta: {
      flex: 1
    },
    author: {
      fontWeight: 'bold'
    },
    date: {
      color: colors.onSurfaceVariant,
      fontSize: 12
    },
    replyTo: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
      fontStyle: 'italic',
      marginBottom: 4
    },
    content: {
      lineHeight: 20
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6
    },
    likes: {
      color: colors.onSurfaceVariant,
      fontSize: 12
    }
  })

  const initial = item.author.charAt(0).toUpperCase()

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
        <View style={styles.meta}>
          <Text variant="bodyMedium" style={styles.author}>
            {item.author}
          </Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </View>
      {item.repliedTo && <Text style={styles.replyTo}>{i18n.t('comments.replyTo', { name: item.repliedTo })}</Text>}
      <Text variant="bodyMedium" style={styles.content}>
        {item.content}
      </Text>
      {item.likes > 0 && (
        <View style={styles.footer}>
          <Text style={styles.likes}>👍 {item.likes}</Text>
        </View>
      )}
    </View>
  )
}

export default function CommentsScreen() {
  const { category, slug } = useLocalSearchParams<{ category: string; slug: string[] }>()
  const router = useRouter()
  const { colors } = useTheme()

  const [yyyy, mm, dd, title] = Array.isArray(slug) ? slug : []
  const articleUrl =
    category && yyyy && mm && dd && title ? `https://www.lemonde.fr/${category}/article/${yyyy}/${mm}/${dd}/${title}` : null

  const [comments, setComments] = useState<Comment[]>([])
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  const { fetch, reset, comments: wvComments, status: wvStatus, webViewProps } = useWebViewComments()

  useEffect(() => {
    if (!articleUrl) return
    // Fast path: use pre-parsed comments from the article fetch
    const cached = commentCache.get(articleUrl)
    if (cached && cached.length > 0) {
      setComments(cached)
      setStatus('done')
      return
    }
    // Slow path: load page again and extract via WebView
    reset()
    fetch(articleUrl)
  }, [articleUrl])

  useEffect(() => {
    if (wvStatus === 'done') {
      setComments(wvComments)
      setStatus('done')
      if (articleUrl) commentCache.set(articleUrl, wvComments)
    } else if (wvStatus === 'error') {
      setStatus('error')
    }
  }, [wvStatus, wvComments])

  const headerTitle = status === 'done' ? i18n.t('comments.titleWithCount', { count: comments.length }) : i18n.t('comments.title')

  return (
    <Surface style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={headerTitle} />
      </Appbar.Header>

      {status === 'loading' ? (
        <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.primary} size="large" />
      ) : status === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{i18n.t('comments.error')}</Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{i18n.t('comments.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommentItem item={item} />}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {status !== 'done' && status !== 'error' && webViewProps && <WebView {...webViewProps} />}
    </Surface>
  )
}
