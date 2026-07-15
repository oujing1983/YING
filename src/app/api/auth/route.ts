import { NextRequest, NextResponse } from 'next/server';

const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin888';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === AUTH_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('lead_ai_auth', AUTH_PASSWORD, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });
    return response;
  }

  return NextResponse.json({ error: '密码错误' }, { status: 401 });
}
