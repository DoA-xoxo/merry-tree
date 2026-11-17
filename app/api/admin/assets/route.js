import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";

export const runtime = "nodejs";

export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "관리자 로그인이 필요해요." }, { status: 401 });
  }

  let pathname;
  try {
    pathname = (await request.json()).pathname;
  } catch {
    return NextResponse.json({ error: "삭제할 이미지를 확인할 수 없어요." }, { status: 400 });
  }

  if (
    typeof pathname !== "string" ||
    !/^assets\/(tree|background|ornament|effect)\/[A-Za-z0-9._-]+\.png$/i.test(pathname)
  ) {
    return NextResponse.json({ error: "삭제할 이미지 경로가 올바르지 않아요." }, { status: 400 });
  }

  try {
    const { blobs } = await list({ prefix: pathname, limit: 10 });
    const blob = blobs.find((item) => item.pathname === pathname);
    if (!blob) return NextResponse.json({ error: "이미지를 찾을 수 없어요." }, { status: 404 });

    await del(blob.url);
    return NextResponse.json({ deleted: true, pathname });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "이미지를 삭제하지 못했어요." },
      { status: 500 },
    );
  }
}
