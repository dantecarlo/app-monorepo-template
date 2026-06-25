export interface IVerifyTokenParams {
  remoteIp?: string
  token: string
}

export interface IBotVerificationResult {
  challengeTs?: string
  errorCodes?: string[]
  hostname?: string
  success: boolean
}

export interface IBotProtectionPort {
  verifyToken(params: IVerifyTokenParams): Promise<IBotVerificationResult>
}
