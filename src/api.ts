import ky, { Options, type KyInstance, type ResponsePromise } from 'ky'

const k = ky.create({
  prefix: 'https://www.lemonde.fr/',
  throwHttpErrors: false,
  timeout: 5000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Referer: 'https://www.lemonde.fr/rss/une.xml',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  }
})

class ApiKy {
  private api: KyInstance

  constructor() {
    this.api = k
  }

  get = (path: string, options?: Options): ResponsePromise => this.api.get(path, options)
  post = (path: string, data: object, options?: Options): ResponsePromise => this.api.post(path, { json: data, ...options })
}

export const Api = new ApiKy()
