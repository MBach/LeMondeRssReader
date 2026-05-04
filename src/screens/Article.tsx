import { useLocalSearchParams, useRouter } from 'expo-router'
import { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Linking, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Button, Card, Surface, Text, useTheme } from 'react-native-paper'
import WebView from 'react-native-webview'

import { FlatListWithHeaders } from '@codeherence/react-native-header'
import ky from 'ky'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArticleItem } from '../components/ArticleItem'
import CustomStatusBar from '../components/CustomStatusBar'
import { FetchError } from '../components/FetchError'
import { HeaderComponent, LargeHeaderComponent } from '../components/Header'
import { SettingsContext } from '../context/SettingsContext'
import { useKeepScreenOn } from '../hooks/useKeepScreenOn'
import { useWebViewFetch } from '../hooks/useWebViewFetch'
import { i18n } from '../locales/i18n'
import { ArticleHeader, ContentType } from '../types'
import { parseArticleHtml } from '../utils/articleParser'
import { commentCache } from '../utils/commentCache'

export default function ArticleScreen() {
  const { category, slug } = useLocalSearchParams<{ category: string; slug: string[] }>()
  const settingsContext = useContext(SettingsContext)
  const router = useRouter()
  const { colors } = useTheme()
  const window = useWindowDimensions()

  const [yyyy, mm, dd, title] = Array.isArray(slug) ? slug : []

  const [article, setArticle] = useState<ArticleHeader | undefined>(undefined)
  const [paragraphes, setParagraphes] = useState<ContentType[]>([])
  const [commentsCount, setCommentsCount] = useState<number | undefined>(undefined)

  const { fetch, reset, html, status, webViewProps } = useWebViewFetch()

  const articleUrl =
    category && yyyy && mm && dd && title ? `https://www.lemonde.fr/${category}/article/${yyyy}/${mm}/${dd}/${title}` : null

  const styles = StyleSheet.create({
    card: { margin: 8, backgroundColor: colors.elevation.level2 },
    footerPadding: { paddingBottom: 40 }
  })

  useKeepScreenOn(settingsContext.keepScreenOn)

  useEffect(() => {
    if (!articleUrl) {
      console.log('[ArticleScreen] params not ready:', { category, slug })
      return
    }
    reset()
    setCommentsCount(undefined)
    console.log('[ArticleScreen] fetching:', articleUrl)
    fetch(articleUrl)
  }, [articleUrl])

  useEffect(() => {
    if (status !== 'done' || !html) return
    try {
      const { article: a, paragraphes: p, comments: c } = parseArticleHtml(html, window.width, settingsContext.hasReadAlso)
      setArticle(a)
      setParagraphes(p)
      if (c.length > 0 && articleUrl) commentCache.set(articleUrl, c)
      if (a.id) {
        ky.get(`https://www.lemonde.fr/ajax/feedbacks/page-stats?pageId=${a.id}`)
          .json<{ totalComments: number }>()
          .then((stats) => {
            if (stats.totalComments > 0) setCommentsCount(stats.totalComments)
          })
          .catch(() => {})
      }
    } catch (e) {
      console.warn('[ArticleScreen] parse error', e)
    }
  }, [status, html])

  const renderItem = ({ item }: { item: ContentType }) => <ArticleItem item={item} />

  const renderFooter = () => {
    return (
      <>
        {article?.isRestricted && !settingsContext.isLoggedIn && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyMedium">{i18n.t('article.restricted')}</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => router.push({ pathname: '/login', params: { mode: 'login' } })}>
                {i18n.t('settings.account.login')}
              </Button>
              <Button mode="contained" onPress={() => Linking.openURL('https://abo.lemonde.fr/')}>
                {i18n.t('article.register')}
              </Button>
            </Card.Actions>
          </Card>
        )}
        {settingsContext.isLoggedIn && commentsCount && commentsCount > 0 && (
          <View style={{ marginTop: 8, marginEnd: 8, flex: 1, flexDirection: 'row-reverse' }}>
            <Button
              mode="contained"
              icon="comment-outline"
              onPress={() =>
                router.push({
                  pathname: `/(home)/${category}/comments/${yyyy}/${mm}/${dd}/${title}` as any
                })
              }>
              {i18n.t('comments.button', { count: commentsCount })}
            </Button>
          </View>
        )}
        <View style={styles.footerPadding} />
      </>
    )
  }

  const isLoading = status === 'idle' || status === 'loading' || !article
  const fetchFailed = status === 'error'
  const dynamicColor = settingsContext.hasDynamicStatusBarColor && article?.isRestricted
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dynamicColor ? colors.primaryContainer : 'transparent', marginBottom: -48 }}>
      {fetchFailed ? (
        <FetchError
          onRetry={() => {
            reset()
            if (articleUrl) fetch(articleUrl)
          }}
        />
      ) : isLoading ? (
        <ActivityIndicator
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
          color={colors.primary}
          size={40}
        />
      ) : (
        <Surface style={{ flex: 1 }}>
          <CustomStatusBar translucent={!dynamicColor} />
          <FlatListWithHeaders
            disableAutoFixScroll
            headerFadeInThreshold={0.8}
            disableLargeHeaderFadeAnim={false}
            data={paragraphes}
            renderItem={renderItem}
            keyExtractor={(_, index) => index.toString()}
            HeaderComponent={(props) => <HeaderComponent {...props} article={article} />}
            LargeHeaderComponent={(props) => <LargeHeaderComponent {...props} article={article} />}
            ListFooterComponent={renderFooter()}
          />
        </Surface>
      )}
      {/* Render outside layout flow so mount/unmount never shifts siblings */}
      {webViewProps && <WebView {...webViewProps} />}
    </SafeAreaView>
  )
}
