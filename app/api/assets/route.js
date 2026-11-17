import { issueSignedToken, list, presignUrl } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["tree", "topper", "background", "ornament", "effect"];
const READ_URL_TTL_MS = 6 * 24 * 60 * 60 * 1000;

function getDisplayName(pathname) {
  const fileName = pathname.split("/").pop() || "image.png";
  const withoutId = fileName.includes("__") ? fileName.split("__").slice(1).join("__") : fileName;
  const withoutExtension = withoutId.toLowerCase().endsWith(".png") ? withoutId.slice(0, -4) : withoutId;
  try { return decodeURIComponent(withoutExtension).replace(/[_-]+/g, " "); }
  catch { return withoutExtension.replace(/[_-]+/g, " "); }
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
  const hasOidcConnection = Boolean(process.env.BLOB_STORE_ID);
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
    const validBlobs = result.blobs.filter((blob) => {
      const parts = blob.pathname.split("/");
      const category = parts[1];
      const fileName = parts[2] || "";
      return parts.length === 3 &&
        parts[0] === "assets" &&
        CATEGORIES.includes(category) &&
        fileName.toLowerCase().endsWith(".png");
    });

    const privateBlobs = validBlobs.filter((blob) => getAccessMode(blob.url) === "private");
    const validUntil = Date.now() + READ_URL_TTL_MS;
    const privateReadToken = privateBlobs.length
      ? await issueSignedToken({
          pathname: "*",
          operations: ["get"],
          validUntil,
        })
      : null;

    const assets = await Promise.all(validBlobs.map(async (blob) => {
      const parts = blob.pathname.split("/");
      const category = parts[1];
      const accessMode = getAccessMode(blob.url);
      let displayUrl = blob.url;
      let isSignedUrl = false;

      if (accessMode === "private" && privateReadToken) {
        const signed = await presignUrl(privateReadToken, {
          operation: "get",
          pathname: blob.pathname,
          access: "private",
          validUntil,
        });
        displayUrl = signed.presignedUrl;
        isSignedUrl = true;
      }

      return {
        id: blob.pathname,
        pathname: blob.pathname,
        category,
        name: getDisplayName(blob.pathname),
        url: displayUrl,
        isPublicUrl: accessMode === "public",
        accessMode,
        isSignedUrl,
        signedUrlExpiresAt: isSignedUrl ? validUntil : null,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };
    }));

    assets.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

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
