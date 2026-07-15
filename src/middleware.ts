import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'lead_ai_auth';
// 默认密码，可在服务器环境变量中覆盖
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin888';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 允许登录页面和 API 通过
  if (pathname === '/login' || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // 检查认证 cookie
  const authToken = request.cookies.get(AUTH_COOKIE)?.value;
  if (authToken !== AUTH_PASSWORD) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
