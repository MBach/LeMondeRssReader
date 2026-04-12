import stringify from 'json-stable-stringify'
import { HTMLElement, Node, parse } from 'node-html-parser'

import {
  ArticleHeader,
  ArticleHeaderParser,
  CarouselCard,
  CarouselContent,
  ContentType,
  ImgContent,
  InlineText,
  SeeAlsoButtonContent
} from '../types'

const IMG_RATIO_REGEX = /https:\/\/img\.lemde.fr\/\d+\/\d+\/\d+\/\d+\/\d+\/(\d+)\/(\d+)\/.*/

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------

export function getBestResolutionFromSrcset(srcset: string, windowWidth: number): string | undefined {
  const candidates = srcset
    .split(',')
    .map((part) => part.trim())
    .map((part) => {
      const [url, widthStr] = part.split(/\s+/)
      const width = parseInt(widthStr, 10)
      return { url, width: isNaN(width) ? 0 : width }
    })
    .filter(({ url, width }) => url.startsWith('http') && width > 0)
    .sort((a, b) => a.width - b.width)

  if (candidates.length === 0) return undefined
  const best = candidates.find((c) => c.width >= windowWidth)
  return (best ?? candidates[candidates.length - 1]).url
}

export function extractFigureContent(figure: HTMLElement, windowWidth: number): ImgContent | null {
  const img = figure.querySelector('img')
  if (!img) return null

  let imgSrc = img.getAttribute('src')

  if (imgSrc?.startsWith('data:image/svg+xml')) {
    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset')
    imgSrc = srcset ? getBestResolutionFromSrcset(srcset, windowWidth) : undefined
  }

  if (!imgSrc) return null

  const caption = figure.querySelector('figcaption')?.textContent?.trim() || null

  const b = IMG_RATIO_REGEX.exec(imgSrc)
  let ratio: number | undefined
  if (b && b.length === 3) {
    const w = parseFloat(b[1])
    const h = parseFloat(b[2])
    if (!isNaN(w) && !isNaN(h)) ratio = w / h
  }

  return { type: 'img', uri: imgSrc, ratio, caption }
}

// ---------------------------------------------------------------------------
// Paragraph / inline content
// ---------------------------------------------------------------------------

export function extractParagraphContent(node: HTMLElement): InlineText[] {
  const content: InlineText[] = []
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      content.push({ type: 'text', text: child.textContent ?? '' })
    } else if (child.nodeType === 1) {
      const el = child as HTMLElement
      if (el.rawTagName === 'span' && el.classNames?.includes('article__kicker')) {
        content.push({ type: 'kicker', text: el.textContent ?? '' })
        return
      }
      switch (el.rawTagName) {
        case 'em':
          content.push({ type: 'em', text: el.textContent ?? '' })
          break
        case 'strong':
          content.push({ type: 'strong', text: el.textContent ?? '' })
          break
        default:
          content.push({ type: 'text', text: el.textContent ?? '' })
      }
    }
  })
  return content
}

// ---------------------------------------------------------------------------
// Node → ContentType
// ---------------------------------------------------------------------------

export function extractContent(node: Node, windowWidth: number, hasReadAlso: boolean): ContentType[] | null {
  if (!node.rawTagName) return null
  const el = node as HTMLElement

  switch (el.rawTagName.toLowerCase()) {
    case 'div': {
      if (!el.classNames || el.classNames.length === 0) break
      if (el.classNames.includes('multimedia-embed') && el.childNodes.length > 0) {
        for (const child of el.childNodes) {
          const c = child as HTMLElement
          if (c.rawTagName === 'figure') {
            const fig = extractFigureContent(c, windowWidth)
            if (fig) return [fig]
          }
        }
      } else if (el.classNames.startsWith('article__video-container')) {
        const player = el.querySelector('.js_player')
        if (player) {
          const provider = player.getAttribute('data-provider')
          const id = player.getAttribute('data-id')
          if (provider && id) return [{ type: 'webview-video', provider, data: id }]
        }
      }
      break
    }
    case 'h2':
      return [{ type: 'h2', data: node.text }]
    case 'h3':
      return [{ type: 'h3', data: node.text }]
    case 'p': {
      if (el.classNames?.includes('article__paragraph') || el.classNames?.includes('article__desc')) {
        return [{ type: 'paragraph', data: extractParagraphContent(el) }]
      }
      break
    }
    case 'section': {
      const catcher = el.querySelector('.catcher__content')
      if (catcher) {
        const readAlso = catcher.querySelector('.catcher__desc .js-article-read-also')
        if (hasReadAlso && readAlso) {
          const seeAlso: SeeAlsoButtonContent = {
            type: 'seeAlsoButton',
            data: readAlso.getAttribute('title') || readAlso.textContent,
            url: readAlso.attrs['href'],
            isRestricted: readAlso.getAttribute('data-premium') === '1'
          }
          return [seeAlso]
        }
      }
      break
    }
    case 'ul': {
      const items: ContentType[] = []
      for (const child of el.childNodes) {
        const c = child as HTMLElement
        if (c.rawTagName === 'li') {
          items.push({ type: 'list', data: c.textContent ?? '' })
        }
      }
      return items
    }
    case 'figure': {
      const fig = extractFigureContent(el, windowWidth)
      if (fig) return [fig]
      break
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Carousel
// ---------------------------------------------------------------------------

export function extractCarousel(nav: HTMLElement, carousel: HTMLElement, windowWidth: number): CarouselContent | null {
  const title = nav.querySelector('a.serie__title')
  const button = nav.querySelector('button > span.text-open')
  if (!title || !button) return null

  const cards: CarouselCard[] = carousel.querySelectorAll('div.serie__card').map((card) => {
    const span = card.querySelector('span[id^="article-title-"]')
    const img = card.querySelector('div.serie__card-article--img > img')
    let imgSrc: string | undefined
    if (img) {
      const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset')
      if (srcset) imgSrc = getBestResolutionFromSrcset(srcset, windowWidth)
    }
    return {
      type: 'carousel-card',
      episode: card.querySelector('h3')?.rawText ?? '',
      link: card.querySelector('a.js-serie-card-link')?.getAttribute('href') ?? '',
      premium: card.querySelector('span.icon__premium') !== null,
      img: imgSrc,
      data: span?.textContent ?? ''
    }
  })

  return {
    type: 'carousel',
    data: title.textContent,
    category: title.getAttribute('href')?.replace('https://www.lemonde.fr/', ''),
    button: button.textContent,
    cards
  }
}

// ---------------------------------------------------------------------------
// Main entry point: parse full HTML → { article, paragraphes }
// ---------------------------------------------------------------------------

export type ParseResult = {
  article: ArticleHeader
  paragraphes: ContentType[]
}

export function parseArticleHtml(html: string, windowWidth: number, hasReadAlso: boolean): ParseResult {
  const doc = parse(html)

  // --- Header / meta ---
  const metas = Array.from(doc.querySelectorAll('meta')).filter((m): m is HTMLElement => m instanceof HTMLElement)
  const a = new ArticleHeaderParser().parse(metas)

  // --- Authors ---
  const longform = doc.getElementById('Longform')
  if (longform) {
    a.authors = ''
    for (const metasAuthor of doc.querySelectorAll('.meta__authors')) {
      const author = metasAuthor.querySelector('a.article__author-link')
      if (author) a.authors = a.authors.concat(author.text.trim())
    }
  } else if (a.authors === '' || a.authors === 'Le Monde') {
    a.authors = doc
      .querySelectorAll('a.article__author-link')
      .map((au: HTMLElement) => au.textContent.trim())
      .join(', ')
  }

  // --- Main container (defensive fallback chain) ---
  const main =
    doc.querySelector('main') ??
    doc.querySelector('#ds-anchor-target-content') ??
    doc.querySelector('article') ??
    doc.querySelector('#main-content') ??
    doc.querySelector('body')

  if (!main) throw new Error('No main container found')

  // --- Date / reading time ---
  const dateEl = main.querySelector('span.meta__date') ?? main.querySelector('p.meta__publisher')
  if (dateEl) a.date = dateEl.rawText

  const readTimeEl = main.querySelector('.meta__reading-time')
  if (readTimeEl?.childNodes.length) {
    let s = readTimeEl.rawText.trim()
    if (s.startsWith('Temps de Lecture ')) s = s.replace('Temps de Lecture ', '')
    a.readingTime = s
  }

  // --- Remove footer noise ---
  main.getElementsByTagName('footer')[0]?.remove()

  // --- Build content map (deduped) ---
  const parMap = new Map<string, ContentType>()

  function append(nodes: Node[]) {
    for (const node of nodes) {
      const items = extractContent(node, windowWidth, hasReadAlso)
      if (!items) continue
      for (const item of items) {
        const key = stringify(item)
        if (key && !parMap.has(key)) parMap.set(key, item)
      }
    }
  }

  // Carousel
  const nav = doc.querySelector('div.serie__nav')
  const serieCarousel = doc.querySelector('div.serie__carousel')
  if (nav && serieCarousel) {
    const carousel = extractCarousel(nav, serieCarousel, windowWidth)
    if (carousel) parMap.set('carousel', carousel)
  }

  // Longform layout
  if (longform) {
    for (const child of longform.childNodes) {
      const el = child as HTMLElement
      if (el.classNames?.includes('article__heading')) {
        append(doc.querySelectorAll('p.article__desc'))
      }
      if (el.classNames?.includes('article__content')) {
        append(el.childNodes)
      }
    }
  }

  // Standard article layout
  const articles = main.getElementsByTagName('article')
  if (articles.length > 0) {
    for (const article of articles) append(article.childNodes)
  }

  // Last resort: parse main directly
  if (parMap.size === 0) append(main.childNodes)

  // --- Prepend metadata items ---
  const meta: ContentType[] = [{ type: 'description', data: a.description }]
  if (a.authors) meta.push({ type: 'authors', data: a.authors })
  if (a.date || a.readingTime) {
    meta.push({ type: 'dateReadingTime', date: a.date, readingTime: a.readingTime })
  }

  return {
    article: a,
    paragraphes: [...meta, ...Array.from(parMap.values())]
  }
}
