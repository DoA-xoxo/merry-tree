import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await get("settings/tree-effects.json", { access: "public" });
    if (!result || result.statusCode !== 200 || !result.stream) return NextResponse.json({ assignments: {} });
    const assignments = await new Response(result.stream).json();
    return NextResponse.json({ assignments: assignments && typeof assignments === "object" && !Array.isArray(assignments) ? assignments : {} });
  } catch {
    return NextResponse.json({ assignments: {} });
  }
}

export async function PUT(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "관리자 로그인이 필요해요." }, { status: 401 });
  try {
    const body = await request.json();
    const assignments = body?.assignments;
    if (!assignments || typeof assignments !== "object" || Array.isArray(assignments)) {
      return NextResponse.json({ error: "트리별 반짝임 설정이 올바르지 않아요." }, { status: 400 });
    }
    const clean = {};
    for (const [treeId, effectIds] of Object.entries(assignments)) {
      if (typeof treeId !== "string" || !treeId.startsWith("assets/tree/") || !Array.isArray(effectIds) || effectIds.some((id) => typeof id !== "string" || !id.startsWith("assets/effect/"))) {
        return NextResponse.json({ error: "이미지 연결 정보가 올바르지 않아요." }, { status: 400 });
      }
      clean[treeId] = [...new Set(effectIds)];
    }
    await put("settings/tree-effects.json", JSON.stringify(clean), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return NextResponse.json({ saved: true, assignments: clean });
  } catch (error) {
    return NextResponse.json({ error: error.message || "트리별 반짝임 설정을 저장하지 못했어요." }, { status: 500 });
  }
}
