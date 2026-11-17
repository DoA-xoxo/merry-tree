import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  compareAdminPassword,
  createAdminSession,
  isAdminRequest,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request) {
  return NextResponse.json({ authenticated: isAdminRequest(request) });
}

export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Vercel 환경 변수 ADMIN_PASSWORD가 설정되지 않았어요." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청을 확인할 수 없어요." }, { status: 400 });
  }

  if (!compareAdminPassword(body?.password)) {
    return NextResponse.json({ error: "관리자 비밀번호가 올바르지 않아요." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSession(), adminCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...adminCookieOptions(), maxAge: 0 });
  return response;
}
