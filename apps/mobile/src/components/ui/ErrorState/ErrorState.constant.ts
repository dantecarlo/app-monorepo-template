export const ERROR_STATE_NAMESPACE = 'components.errorState' as const

export enum ErrorStateCodeEnum {
  FORBIDDEN = '403',
  NOT_FOUND = '404',
  OFFLINE = 'offline',
  SERVER_ERROR = '500'
}
