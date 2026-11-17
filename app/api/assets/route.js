import { list } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["tree", "background", "ornament", "effect"];

function getDisplayName(pathname) {
  const fileName = pathname.split("/").pop() || "image.png";
  const withoutId = fileName.includes("__") ? fileName.split("__").slice(1).join("__") : fileName;
  return decodeURIComponent(withoutId.replace(/\\.png$/i, "")).replace(/[_-]+/g, " ");
}

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { assets: [], configured: false, error: "Vercel Blob 저장소가 아직 연결되지 않았어요." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await list({ prefix: "assets/", limit: 1000 });
    const assets = result.blobs
      .map((blob) => {
        const match = blob.pathname.match(/^assets\\/(tree|background|ornament|effect)\\//);
        if (!match || !/\\.png$/i.test(blob.pathname)) return null;
        return {
          id: blob.pathname,
          pathname: blob.pathname,
          category: match[1],
          name: getDisplayName(blob.pathname),
          url: blob.url,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

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
