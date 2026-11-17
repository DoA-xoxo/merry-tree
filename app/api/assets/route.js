import { get, list } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["tree", "topper", "background", "ornament", "effect"];

function getDisplayName(pathname) {
  const fileName = pathname.split("/").pop() || "image.png";
  const labelMarker = "__label__";
  const markerIndex = fileName.indexOf(labelMarker);

  if (markerIndex >= 0) {
    const encodedLabel = fileName.slice(markerIndex + labelMarker.length).replace(/\.png$/i, "");
    try {
      const decoded = Buffer.from(encodedLabel, "base64url").toString("utf8").trim();
      if (decoded && !decoded.includes("\uFFFD")) return decoded;
    } catch {}
  }

  // Legacy files keep the filename-derived label.
  const separator = fileName.indexOf("__");
  const legacyName = separator > 0 ? fileName.slice(separator + 2) : fileName;
  return legacyName.replace(/\.png$/i, "").replace(/[_-]+/g, " ");
}

function getAccessMode(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes(".private.blob.vercel-storage.com")) return "private";
    if (hostname.includes(".public.blob.vercel-storage.com")) return "public";
  } catch {}
  return "unknown";
}

export async function GET() {
  if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) {
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
    let treeEffectAssignments = {};
    try {
      const settings = await get("settings/tree-effects.json", { access: "private" });
      if (settings?.statusCode === 200 && settings.stream) {
        const saved = await new Response(settings.stream).json();
        if (saved && typeof saved === "object" && !Array.isArray(saved)) treeEffectAssignments = saved;
      }
    } catch {}
    const assets = result.blobs.map((blob) => {
      const parts = blob.pathname.split("/");
      const category = parts[1];
      const fileName = parts[2] || "";
      if (
        parts.length !== 3 ||
        parts[0] !== "assets" ||
        !CATEGORIES.includes(category) ||
        !fileName.toLowerCase().endsWith(".png")
      ) return null;

      const accessMode = getAccessMode(blob.url);
      return {
        id: blob.pathname,
        pathname: blob.pathname,
        category,
        name: getDisplayName(blob.pathname),
        url: "/api/assets/image?pathname=" + encodeURIComponent(blob.pathname) + "&access=" + accessMode,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };
    }).filter(Boolean);

    assets.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return Response.json(
      { assets, treeEffectAssignments, configured: true },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return Response.json(
      { assets: [], configured: false, error: error.message || "이미지 목록을 불러오지 못했어요." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
