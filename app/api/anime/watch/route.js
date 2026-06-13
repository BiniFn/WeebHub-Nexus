import { NextResponse } from "next/server";

const JUSTANIME_API = "https://core.justanime.to/api";
const JUSTANIME_HEADERS = {
  Origin: "https://www.justanime.to",
  Referer: "https://www.justanime.to/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
};

/**
 * Legacy watch endpoint — now proxies to JustAnime API 
 * instead of the dead Consumet API.
 * 
 * Query params:
 *   - episodeid: AniList anime ID
 *   - ep: episode number (defaults to 1)
 *   - isdub: "true" for dub audio
 *   - provider: megaplay | animepahe | miruro | animegg
 */
export async function GET(req) {
  try {
    const episodeId = req.nextUrl.searchParams.get("episodeid");
    const ep = req.nextUrl.searchParams.get("ep") || "1";
    const isdub = req.nextUrl.searchParams.get("isdub") === "true";
    const provider = req.nextUrl.searchParams.get("provider") || "megaplay";

    if (!episodeId) {
      return NextResponse.json({ error: "Episode ID is required" }, { status: 400 });
    }

    // Extract numeric AniList ID if episodeId contains a slug (e.g. "naruto-episode-1")
    const anilistId = episodeId.replace(/\D/g, "") || episodeId;

    const url = `${JUSTANIME_API}/watch/${anilistId}/episode/${ep}/${provider}`;
    const res = await fetch(url, {
      headers: JUSTANIME_HEADERS,
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Provider ${provider} returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error handling GET request:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch streaming data. Please try again later." },
      { status: 500 }
    );
  }
}
