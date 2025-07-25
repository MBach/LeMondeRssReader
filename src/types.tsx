import { NavigatorScreenParams } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { HTMLElement } from 'node-html-parser'

export interface ParsedRssItem {
  title: string
  description: string
  link: string
  uri: string
}

export interface SubCategory {
  name: string
  active: boolean
  uri: string
  subPath?: string
  isTranslatable: boolean
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
  isTranslatable: boolean
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
  MainStack: NavigatorScreenParams<MainStackParamList>
  Favorites: undefined
  Settings: undefined
  Root: undefined
  Home: undefined
}
export type MainStackNavigation = NativeStackNavigationProp<MainStackParamList>

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
  title: string
  description: string
  url: string
  imgUrl?: string
  imgRatio?: number
  category?: string
  authors?: string
  date?: string
  readingTime?: string
  isRestricted: boolean
}

type OgPropertyKey = keyof ArticleHeader

type OgPropertyMap = {
  property: string
  key: OgPropertyKey
  transform?: (value: string) => any
}

export class ArticleHeaderParser {
  private ogProperties: OgPropertyMap[] = [
    { property: 'ad:article_id', key: 'id' },
    { property: 'og:title', key: 'title' },
    { property: 'og:description', key: 'description' },
    { property: 'og:url', key: 'url' },
    { property: 'og:image', key: 'imgUrl' },
    { property: 'og:article:section', key: 'category' },
    { property: 'og:article:author', key: 'authors' },
    {
      property: 'og:article:content_tier',
      key: 'isRestricted',
      transform: (value: string) => value === 'locked'
    }
  ]

  parse(metas: HTMLElement[]): ArticleHeader {
    const articleHeader: Partial<ArticleHeader> = {}

    for (const meta of metas) {
      const property = meta.getAttribute('property') || meta.getAttribute('name')
      const content = meta.getAttribute('content')

      if (!property || !content) continue

      const ogProp = this.ogProperties.find((p) => p.property === property)
      if (!ogProp) continue

      const { key, transform } = ogProp
      articleHeader[key] = transform ? transform(content) : content
    }

    // Calculate image ratio if width/height available
    if (articleHeader.imgUrl) {
      const width = metas.find((m) => m.getAttribute('property') === 'og:image:width')?.getAttribute('content')
      const height = metas.find((m) => m.getAttribute('property') === 'og:image:height')?.getAttribute('content')
      if (width && height) {
        const widthNum = parseInt(width, 10)
        const heightNum = parseInt(height, 10)
        if (!isNaN(widthNum) && !isNaN(heightNum) && widthNum !== 0) {
          articleHeader.imgRatio = heightNum / widthNum
        }
      }
    }

    // Return finalized ArticleHeader with fallbacks
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
      isRestricted: articleHeader.isRestricted ?? false
    }
  }
}

// BaseContent Interface

interface BaseContent {
  type: string
  data: string
}

// Derived Content Types

class WebviewVideo implements BaseContent {
  type: string = 'webview-video'
  data: string
  provider: string

  constructor(data: string, provider: string) {
    this.data = data
    this.provider = provider
  }
}

interface CaptionContent extends BaseContent {
  type: 'caption'
}

export interface CarouselCard extends BaseContent {
  type: 'carousel-card'
  episode: string
  link: string
  premium: boolean
  img?: string
}

export interface CarouselContent extends BaseContent {
  type: 'carousel'
  category?: string
  button: string
  cards: CarouselCard[]
}

interface H1Content extends BaseContent {
  type: 'h1'
}

interface H2Content extends BaseContent {
  type: 'h2'
}

interface H3Content extends BaseContent {
  type: 'h3'
}

type HeadingContent = H1Content | H2Content | H3Content

interface AuthorsContent extends BaseContent {
  type: 'authors'
}

interface DateReadingTime {
  type: 'dateReadingTime'
  date?: string
  readingTime?: string
}

interface DescContent extends BaseContent {
  type: 'description'
}

interface DivContent extends BaseContent {
  type: 'div'
}

export interface ImgContent {
  type: 'img'
  uri: string
  ratio?: number
  caption?: string | null
}

interface ListContent extends BaseContent {
  type: 'list'
}

interface IframeContent extends BaseContent {
  type: 'iframe'
}

export type InlineText =
  | { type: 'kicker'; text: string }
  | { type: 'text'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'em'; text: string }

type ParagraphContent = {
  type: 'paragraph'
  data: InlineText[]
}

export interface SeeAlsoButtonContent {
  type: 'seeAlsoButton'
  data: string
  url: string
  isRestricted: boolean
}

interface WebviewVideoContent extends BaseContent {
  type: 'webview-video'
  provider: string
}

export type ContentType =
  | AuthorsContent
  | CaptionContent
  | CarouselContent
  | DateReadingTime
  | DescContent
  | DivContent
  | HeadingContent
  | IframeContent
  | ImgContent
  | ListContent
  | ParagraphContent
  | SeeAlsoButtonContent
  | WebviewVideoContent

// Live Content

interface QuoteContent extends BaseContent {
  type: 'quote'
  author: string
}

interface MetaContent extends BaseContent {
  type: 'chip'
  lastUpdated: string
}

export type LiveContentType = ContentType | QuoteContent | MetaContent

export interface SectionContent {
  id: string
  hero: boolean
  hasBorder: boolean
  header?: string
  contents: LiveContentType[]
}
