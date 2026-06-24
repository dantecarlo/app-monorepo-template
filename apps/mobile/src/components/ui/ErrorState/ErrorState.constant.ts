export const ERROR_STATE_NAMESPACE = 'components.errorState' as const

export enum ErrorStateCodeEnum {
  Forbidden = '403',
  NotFound = '404',
  Offline = 'offline',
  ServerError = '500'
}
