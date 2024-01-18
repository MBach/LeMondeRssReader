export interface ParsedRssItem {
  id: string
  title: string
  description: string
  isRestricted: boolean
  link: string
  uri: string
}

export interface ExtentedRssItem extends ParsedRssItem {
  imgUri: any
  category: string
  authors: string
  date: string
  readTime: string
}

export interface SubCategory {
  name: string
  active: boolean
  uri: string
  subPath?: string
}

interface ColorCategory {
  dark: string
  light: string
}

export interface Category {
  cat: string
  color: ColorCategory
  subCats: SubCategory[]
}

export interface Feed {
  content: Category[]
}

export interface MenuEntry {
  cat: string
  color: string
  name: string
  uri: string
  subPath?: string
}

export enum ArticleType {
  ARTICLE = 'article',
  LIVE = 'live',
  PODCAST = 'podcast',
  VIDEO = 'video'
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  SYSTEM = 'system'
}
