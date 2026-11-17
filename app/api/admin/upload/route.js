import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";

export const runtime = "nodejs";

const CATEGORIES = ["tree", "background", "ornament", "effect"];

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "관리자 로그인이 필요해요." }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Vercel Blob 저장소를 연결해 주세요." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!isAdminRequest(request)) throw new Error("관리자 로그인이 필요해요.");
        const match = pathname.match(/^assets\\/(tree|background|ornament|effect)\\/[A-Za-z0-9._-]+\\.png$/i);
        if (!match || !CATEGORIES.includes(match[1])) {
          throw new Error("허용되지 않은 이미지 경로예요.");
        }
        let payload;
        try { payload = JSON.parse(clientPayload || "{}"); } catch { payload = {}; }
        if (payload.category !== match[1]) throw new Error("이미지 분류가 올바르지 않아요.");

        return {
          allowedContentTypes: ["image/png"],
          maximumSizeInBytes: 15 * 1024 * 1024,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ category: match[1] }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "이미지를 업로드하지 못했어요." },
      { status: 400 },
    );
  }
}
