import ky, { Options, type KyInstance, type ResponsePromise } from 'ky'

const k = ky.create({
  prefixUrl: 'https://www.lemonde.fr',
  throwHttpErrors: false,
  timeout: 5000
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
