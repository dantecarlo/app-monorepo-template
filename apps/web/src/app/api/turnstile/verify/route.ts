import { type NextRequest, NextResponse } from 'next/server'

import { botProtection } from '@/lib/bot-protection/botProtection.adapter'

const BAD_REQUEST_STATUS = 400
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

interface IVerifyRequestBody {
  token?: string
}

export const POST = async (
  request: NextRequest
): Promise<NextResponse> => {
  const body = (await request.json()) as IVerifyRequestBody
  const token = body.token ?? ''

  const result = await botProtection.verifyToken({
    remoteIp: request.headers.get('x-forwarded-for') ?? undefined,
    token
  })

  if (!result.success) {
    return NextResponse.json(
      { errorCodes: result.errorCodes, success: false },
      { headers: NO_STORE_HEADERS, status: BAD_REQUEST_STATUS }
    )
  }

  return NextResponse.json(
    { success: true },
    { headers: NO_STORE_HEADERS }
  )
}
