import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["tree", "topper", "background", "ornament", "effect"];

function isAllowedPathname(pathname) {
  const parts = typeof pathname === "string" ? pathname.split("/") : [];
  const category = parts[1];
  const fileName = parts[2] || "";
  return parts.length === 3 &&
    parts[0] === "assets" &&
    CATEGORIES.includes(category) &&
    fileName.toLowerCase().endsWith(".png") &&
    /^[A-Za-z0-9._-]+$/.test(fileName);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname");

  if (!isAllowedPathname(pathname)) {
    return new Response("Invalid image path", { status: 400 });
  }

  try {
    const access = process.env.BLOB_STORE_ID ? undefined : "public";
    let result;

    if (access) {
      result = await get(pathname, { access });
    } else {
      try {
        result = await get(pathname, { access: "public" });
      } catch {
        result = await get(pathname, { access: "private" });
      }
    }

    if (!result || result.statusCode !== 200 || !result.stream) {
      return new Response("Image not found", { status: 404 });
    }

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "image/png",
        "Content-Length": String(result.blob.size || ""),
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "ETag": result.blob.etag,
      },
    });
  } catch (error) {
    return new Response(
      "Unable to load image: " + (error.message || "Blob request failed"),
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
