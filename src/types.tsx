import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { HTMLElement } from 'node-html-parser'

export interface ParsedRssItem {
  title: string
  description: string
  isRestricted: boolean
  link: string
  uri: string
}

export interface SubCategory {
  name: string
  active: boolean
  uri: string
  subPath?: string
}

export interface Category {
  cat: string
  subCats: SubCategory[]
}

export interface Feed {
  content: Category[]
}

export interface MenuEntry {
  cat: string
  name: string
  uri: string
  subPath?: string
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  SYSTEM = 'system'
}

export enum ArticleType {
  ARTICLE = 'Article',
  LIVE = 'Live',
  PODCAST = 'Podcast',
  VIDEO = 'Video'
}

export type MainScreenNames = 'Home' | 'Article' | 'Live' | 'Podcast' | 'Video'
export type MainStackParamList = Record<MainScreenNames, ParsedLink>
export type RootStackParamList = {
  MainStack: undefined
  Favorites: undefined
  Settings: undefined
  Root: undefined
}
export type MainStackNavigation = NativeStackNavigationProp<MainStackParamList>

export interface ParsedLink {
  category: string
  yyyy: string
  mm: string
  dd: string
  title: string
}

// Deep linking

export interface ParsedLink {
  type: ArticleType
  category: string
  yyyy: string
  mm: string
  dd: string
  title: string
}

export const parseAndGuessURL = (url: string): ParsedLink | null => {
  const regex = /https:\/\/www\.lemonde\.fr\/([^/]+)\/(article|live|podcast|video)\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)/
  const match = url.match(regex)

  if (match) {
    const [, category, type, yyyy, mm, dd, title] = match
    const articleType = type.toUpperCase() as keyof typeof ArticleType
    if (ArticleType[articleType]) {
      return { type: ArticleType[articleType], category, yyyy, mm, dd, title }
    }
  }
  return null
}

// Article

export type ArticleHeader = {
  id?: string
  url: string
  imgUrl?: string
  imgRatio?: number
  category?: string
  title: string
  description: string
  authors?: string
  date: string
  readingTime?: string
  isRestricted: boolean
}

export class ArticleHeaderParser {
  private ogProperties = [
    { property: 'ad:article_id', key: 'id' },
    { property: 'og:title', key: 'title' },
    { property: 'og:description', key: 'description' },
    { property: 'og:url', key: 'url' },
    { property: 'og:image', key: 'imgUrl' },
    { property: 'og:article:section', key: 'category' },
    { property: 'og:article:author', key: 'authors' },
    { property: 'og:article:content_tier', key: 'isRestricted', transform: (value: string) => value === 'locked' }
  ]

  parse(metas: HTMLElement[]): ArticleHeader {
    const articleHeader: Partial<ArticleHeader> = {}

    for (const meta of metas) {
      const property = meta.getAttribute('property')
      const content = meta.getAttribute('content')

      if (!property || !content) continue

      const ogProp = this.ogProperties.find((p) => p.property === property)

      if (ogProp) {
        if (ogProp.transform) {
          articleHeader[ogProp.key] = ogProp.transform(content)
        } else {
          articleHeader[ogProp.key] = content
        }
      }
    }

    // Second pass for image ratio
    if (articleHeader.imgUrl) {
      const widthItem = metas.find((meta) => meta.getAttribute('property') === 'og:image:width')
      const heightItem = metas.find((meta) => meta.getAttribute('property') === 'og:image:height')
      if (widthItem && heightItem) {
        const width = widthItem.getAttribute('content')
        const height = heightItem.getAttribute('content')
        if (width && height) {
          articleHeader.imgRatio = parseInt(height) / parseInt(width)
        }
      }
    }

    // Assuming default values for mandatory fields if not found in the meta tags
    return {
      id: articleHeader.id,
      url: articleHeader.url || '',
      imgUrl: articleHeader.imgUrl,
      imgRatio: articleHeader.imgRatio,
      category: articleHeader.category,
      title: articleHeader.title || '',
      description: articleHeader.description || '',
      authors: articleHeader.authors,
      date: articleHeader.date || '',
      readingTime: articleHeader.readingTime,
      isRestricted: articleHeader.isRestricted || false
    }
  }
}

/// Article and Live

export type BaseContent = {
  type: string
  data: string
}

export class WebviewVideo implements BaseContent {
  type: string = 'webview-video'
  data: string
  provider: string
  constructor(data: string, provider: string) {
    this.data = data
    this.provider = provider
  }
}

export type CaptionContent = {
  type: 'caption'
  data: string
}

export type H1Content = {
  type: 'h1'
  data: string
}

export type H2Content = {
  type: 'h2'
  data: string
}

export type H3Content = {
  type: 'h3'
  data: string
}

export type DivContent = {
  type: 'div'
  data: string
}

export type ImgContent = {
  type: 'img'
  uri: string
  ratio?: number
  caption?: string | null
}

export type ListContent = {
  type: 'list'
  data: string
}

export type IframeContent = {
  type: 'iframe'
  data: string
}

export type ParagraphContent = {
  type: 'paragraph'
  data: string
}

export type SeeAlsoButtonContent = {
  type: 'seeAlsoButton'
  data: string
  url: string
  isRestricted: boolean
}

export type ContentType =
  | CaptionContent
  | DivContent
  | H1Content
  | H2Content
  | H3Content
  | IframeContent
  | ImgContent
  | ListContent
  | ParagraphContent
  | SeeAlsoButtonContent

// Live

export type QuoteContent = {
  type: 'quote'
  data: string
  author: string
}

export type WebviewVideoContent = {
  type: 'webview-video'
  provider: string
  data: string
}

export type LiveContentType = ContentType | QuoteContent | WebviewVideoContent

export type SectionContent = {
  id: string
  hero: boolean
  hasBorder: boolean
  header?: string
  contents: LiveContentType[]
}
