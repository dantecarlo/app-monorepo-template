export interface ICreateBackendClientParams {
  anonKey: string
  url: string
}

export interface IBackendClientProvider<TClient = unknown> {
  createClient(params: ICreateBackendClientParams): TClient
}
