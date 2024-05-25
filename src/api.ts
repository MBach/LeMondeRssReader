import ky from 'ky'

const k = ky.create({
  prefixUrl: 'https://www.lemonde.fr',
  throwHttpErrors: false,
  timeout: 5000
})

class ApiKy {
  private api: typeof ky

  constructor() {
    this.api = k
  }

  get = (path: string, options?: object) => this.api.get(path, options)
  post = (path: string, data: object) => this.api.post(path, { json: data })
}

const Api = new ApiKy()

export default Api
