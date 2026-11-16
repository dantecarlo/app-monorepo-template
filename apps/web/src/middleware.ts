import { type NextRequest, NextResponse } from 'next/server'

import { originGuard } from '@/lib/origin-guard/originGuard.adapter'

const FORBIDDEN_STATUS = 403

export const middleware = (request: NextRequest): NextResponse => {
  const { trusted } = originGuard.assertTrustedOrigin({
    headers: {
      get: (name: string) => request.headers.get(name)
    }
  })

  if (!trusted) {
    return new NextResponse(null, { status: FORBIDDEN_STATUS })
  }

  return NextResponse.next()
}

// Each exempt name is anchored: a folder ends in its slash and a file in the end
// of the path, so a route that only starts like one (/imagesadmin, /favicon.icox)
// still runs the guard.
export const config = {
  matcher: [
    '/((?!_next/static/|_next/image$|favicon\\.ico$|images/|fonts/).*)'
  ]
}
