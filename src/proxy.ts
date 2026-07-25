import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_URL })
  
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')

  if (isAuthPage) {
    if (token) {
      const role = token.role as string
      let redirectUrl = '/'
      if (role === 'EMPLOYEE') redirectUrl = '/employee'
      else if (role === 'MANAGER') redirectUrl = '/manager'
      else if (role === 'COORDINATOR') redirectUrl = '/coordinator'
      else if (role === 'DIRECTOR') redirectUrl = '/director'
      
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
