export interface ParsedRssItem {
  id: string
  title: string
  description: string
  isRestricted: boolean
  link: string
  uri: string
}

export interface FeedItem {
  name: string
  active: boolean
  uri: string
  subPath?: string
}

export interface Category {
  cat: string
  color: string
  feeds: FeedItem[]
}

export interface Feed {
  content: Category[]
}

export enum ArticleType {
  ARTICLE = 'article',
  LIVE = 'live',
  PODCAST = 'podcast',
  VIDEO = 'video'
}

export class LiveCommentNode {
  type!: 'br' | 'paragraph' | 'img'
  text?: string
  fontWeight: undefined | 'bold'
  fontStyle: undefined | 'italic'
  quote?: boolean
}
