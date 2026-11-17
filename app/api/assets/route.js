import { list } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["tree", "topper", "background", "ornament", "effect"];

function getDisplayName(pathname) {
  const fileName = pathname.split("/").pop() || "image.png";
  const withoutId = fileName.includes("__") ? fileName.split("__").slice(1).join("__") : fileName;
  const withoutExtension = withoutId.toLowerCase().endsWith(".png") ? withoutId.slice(0, -4) : withoutId;
  try { return decodeURIComponent(withoutExtension).replace(/[_-]+/g, " "); }
  catch { return withoutExtension.replace(/[_-]+/g, " "); }
}

export async function GET() {
  const hasOidcConnection = Boolean(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  const hasReadWriteToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (!hasOidcConnection && !hasReadWriteToken) {
    return Response.json(
      {
        assets: [],
        configured: false,
        error: "Blob 연결 인증 정보가 없어요. 저장소 Projects에서 Production 환경 연결을 확인해 주세요.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await list({ prefix: "assets/", limit: 1000 });
    const assets = result.blobs.map((blob) => {
      const parts = blob.pathname.split("/");
      const category = parts[1];
      const fileName = parts[2] || "";
      if (parts.length !== 3 || parts[0] !== "assets" || !CATEGORIES.includes(category) || !fileName.toLowerCase().endsWith(".png")) {
        return null;
      }
      return {
        id: blob.pathname,
        pathname: blob.pathname,
        category,
        name: getDisplayName(blob.pathname),
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };
    }).filter(Boolean).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return Response.json(
      { assets, configured: true },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return Response.json(
      { assets: [], configured: false, error: error.message || "이미지 목록을 불러오지 못했어요." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
