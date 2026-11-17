import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";

export const runtime = "nodejs";

const CATEGORIES = ["tree", "topper", "background", "ornament", "effect"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

function hasBlobConnection() {
  const hasOidc = Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  const hasReadWriteToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return hasOidc || hasReadWriteToken;
}

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "관리자 로그인이 필요해요." }, { status: 401 });
  }

  if (!hasBlobConnection()) {
    return NextResponse.json(
      { error: "Blob 연결 인증 정보가 없어요. 저장소 Projects에서 Production 환경 연결을 확인해 주세요." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const response = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        if (!isAdminRequest(request)) throw new Error("관리자 로그인이 필요해요.");

        const parts = pathname.split("/");
        const category = parts[1];
        const fileName = parts[2] || "";

        if (
          parts.length !== 3 ||
          parts[0] !== "assets" ||
          !CATEGORIES.includes(category) ||
          !fileName.toLowerCase().endsWith(".png") ||
          !/^[A-Za-z0-9._-]+$/.test(fileName)
        ) {
          throw new Error("허용되지 않은 PNG 경로예요.");
        }

        let payload;
        try { payload = JSON.parse(clientPayload || "{}"); } catch { payload = {}; }
        if (payload.category !== category) {
          throw new Error("이미지 분류가 올바르지 않아요.");
        }

        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ["image/png"],
          maximumSizeInBytes: MAX_FILE_SIZE,
          validUntil: Date.now() + 10 * 60 * 1000,
        });

        return {
          token,
          urlOptions: {
            allowedContentTypes: ["image/png"],
            maximumSizeInBytes: MAX_FILE_SIZE,
            cacheControlMaxAge: 60 * 60 * 24 * 365,
            addRandomSuffix: false,
            allowOverwrite: false,
          },
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
