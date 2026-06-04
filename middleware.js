import { NextResponse } from 'next/server';

const PASSWORD = 'Tableronde123';
const COOKIE_NAME = 'kairos_auth';

export function middleware(request) {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === PASSWORD) return NextResponse.next();

  const url = request.nextUrl;
  if (url.pathname === '/api/auth') return NextResponse.next();

  if (url.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
