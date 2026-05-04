import { Comment } from '../types'

const _cache: Record<string, Comment[]> = {}

export const commentCache = {
  set(url: string, comments: Comment[]) {
    _cache[url] = comments
  },
  get(url: string): Comment[] | undefined {
    return _cache[url]
  }
}
