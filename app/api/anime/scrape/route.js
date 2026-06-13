import * as cheerio from "cheerio";

// ─── JustAnime API Backend (Primary) ─────────────────────────────
const JUSTANIME_API = "https://core.justanime.to/api";
const JUSTANIME_HEADERS = {
  Origin: "https://www.justanime.to",
  Referer: "https://www.justanime.to/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
};

// Ordered by reliability — megaplay first, then animepahe, miruro, animegg
const PROVIDERS = ["megaplay", "animepahe", "miruro", "animegg"];

/**
 * Fetch streaming sources from JustAnime's backend for a single provider.
 * Returns { sub, dub } with sources arrays or null on failure.
 */
async function fetchFromJustAnime(anilistId, episode, provider) {
  try {
    const url = `${JUSTANIME_API}/watch/${anilistId}/episode/${episode}/${provider}`;
    const res = await fetch(url, {
      headers: JUSTANIME_HEADERS,
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Try all JustAnime providers in order until one returns valid sources.
 * If a specific provider is requested, try that first.
 */
async function resolveJustAnime(anilistId, episode, preferredProvider, audioType = "sub") {
  const ordered = preferredProvider
    ? [preferredProvider, ...PROVIDERS.filter((p) => p !== preferredProvider)]
    : PROVIDERS;

  for (const provider of ordered) {
    const data = await fetchFromJustAnime(anilistId, episode, provider);
    if (!data) continue;

    // Check the requested audio type first, then fallback
    const primary = audioType === "dub" ? data.dub : data.sub;
    const fallback = audioType === "dub" ? data.sub : data.dub;
    const chosen = primary || fallback;

    if (chosen?.sources?.length > 0) {
      return {
        provider,
        audioType: primary ? audioType : audioType === "dub" ? "sub" : "dub",
        sources: chosen.sources,
        subtitles: chosen.subtitles || chosen.tracks || [],
        intro: chosen.intro || null,
        outro: chosen.outro || null,
        headers: chosen.headers || null,
      };
    }
  }

  return null;
}

// ─── Anipub Scraper (Fallback) ─────────────────────────────────
async function scrapeAnipub(title, episode) {
  try {
    const searchRes = await fetch(`https://www.anipub.xyz/api/search/${encodeURIComponent(title)}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!searchRes.ok) return null;
    
    const searchData = await searchRes.json();
    if (!Array.isArray(searchData) || searchData.length === 0) return null;
    
    // Pick the first result's Id
    const anipubId = searchData[0].Id;
    if (!anipubId) return null;
    
    const detailsRes = await fetch(`https://www.anipub.xyz/v1/api/details/${anipubId}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!detailsRes.ok) return null;
    
    const detailsData = await detailsRes.json();
    const local = detailsData.local;
    if (!local) return null;
    
    let targetLink = null;
    if (episode === 1 && local.link) {
      targetLink = local.link;
    } else if (episode > 1 && Array.isArray(local.ep)) {
      const epIndex = episode - 2;
      if (local.ep[epIndex] && local.ep[epIndex].link) {
        targetLink = local.ep[epIndex].link;
      }
    }
    
    if (!targetLink) return null;
    
    const iframeUrl = targetLink.replace(/^src=/, '');
    if (!iframeUrl) return null;
    
    return {
      provider: "anipub",
      audioType: "sub", // Anipub defaults to sub
      sources: [{ url: iframeUrl, quality: "auto", isM3U8: false, isIframe: true }],
      subtitles: [],
      intro: null,
      outro: null,
      headers: null,
    };
  } catch (err) {
    console.error("Anipub scraper error:", err.message);
    return null;
  }
}

// ─── AnikotoTV Scraper (Fallback) ─────────────────────────────────
async function scrapeAnikoto(title, episode) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    Referer: "https://anikototv.to/",
  };

  try {
    // 1. Search
    const searchRes = await fetch(
      `https://anikototv.to/filter?keyword=${encodeURIComponent(title)}`,
      { headers, signal: AbortSignal.timeout(10000) }
    );
    const searchHtml = await searchRes.text();
    const $ = cheerio.load(searchHtml);
    const animeLink =
      $(".item a.name.d-title").first().attr("href") ||
      $(".ani.poster.tip a").first().attr("href");
    if (!animeLink) return null;

    // 2. Get series ID
    const animeRes = await fetch(`https://anikototv.to${animeLink}`, { headers });
    const animeHtml = await animeRes.text();
    const $anime = cheerio.load(animeHtml);
    const seriesId =
      $anime('div[id^="watch"][data-id]').first().attr("data-id") ||
      $anime("main [data-id]").first().attr("data-id") ||
      animeHtml.match(/data-id="(\d+)"/)?.[1];
    if (!seriesId) return null;

    // 3. Get episode list
    const epsRes = await fetch(
      `https://anikototv.to/ajax/episode/list/${seriesId}`,
      { headers: { ...headers, "X-Requested-With": "XMLHttpRequest" } }
    );
    const epsData = await epsRes.json();
    const $eps = cheerio.load(epsData.result);

    let targetEp = null;
    $eps("a[data-ids]").each((i, el) => {
      const num = parseInt($eps(el).attr("data-num") || "0");
      if (num === episode || (num === 0 && i + 1 === episode)) {
        targetEp = $eps(el);
      }
    });
    if (!targetEp) return null;

    const dataIds = targetEp.attr("data-ids");

    // 4. Get servers
    const serversRes = await fetch(
      `https://anikototv.to/ajax/server/list?servers=${dataIds}`,
      { headers: { ...headers, "X-Requested-With": "XMLHttpRequest" } }
    );
    const serversData = await serversRes.json();
    const $servers = cheerio.load(serversData.result);

    const linkId =
      $servers('.servers .type[data-type="sub"] li[data-link-id]')
        .first()
        .attr("data-link-id") ||
      $servers('.servers .type[data-type="dub"] li[data-link-id]')
        .first()
        .attr("data-link-id");
    if (!linkId) return null;

    // 5. Get embed URL
    const embedRes = await fetch(
      `https://anikototv.to/ajax/server?get=${linkId}`,
      { headers: { ...headers, "X-Requested-With": "XMLHttpRequest" } }
    );
    const embedData = await embedRes.json();
    const embedUrl = embedData.result?.url;
    if (!embedUrl) return null;

    // 6. Extract stream from embed
    const origin = new URL(embedUrl).origin;
    const embedPageRes = await fetch(embedUrl, {
      headers: { Referer: "https://anikototv.to/" },
    });
    const embedHtml = await embedPageRes.text();
    const dataId =
      cheerio.load(embedHtml)("#megaplay-player").attr("data-id") ||
      embedHtml.match(/data-id="([^"]+)"/)?.[1];
    if (!dataId) return null;

    const sourceRes = await fetch(
      `${origin}/stream/getSources?id=${dataId}`,
      {
        headers: {
          ...headers,
          "X-Requested-With": "XMLHttpRequest",
          Referer: embedUrl,
        },
      }
    );
    const sourceData = await sourceRes.json();
    const m3u8 = Array.isArray(sourceData.sources)
      ? sourceData.sources[0]?.file
      : sourceData.sources?.file;

    if (!m3u8) return null;

    return {
      provider: "anikoto",
      audioType: "sub",
      sources: [{ url: m3u8, quality: "auto", isM3U8: true }],
      subtitles: sourceData.tracks || [],
      intro: null,
      outro: null,
      headers: null,
    };
  } catch (err) {
    console.error("Anikoto scraper error:", err.message);
    return null;
  }
}

// ─── API Handler ─────────────────────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // Support both AniList ID (preferred) and title-based lookup
  const anilistId = searchParams.get("id");
  const title = searchParams.get("title");
  const ep = parseInt(searchParams.get("ep") || "1");
  const provider = searchParams.get("provider"); // optional: megaplay, animepahe, miruro, animegg
  const audio = searchParams.get("audio") || "sub"; // sub or dub

  if (!anilistId && !title) {
    return Response.json({ error: "Missing id or title parameter" }, { status: 400 });
  }

  try {
    // Strategy 1: Use JustAnime API (if we have an AniList ID)
    if (anilistId) {
      const result = await resolveJustAnime(anilistId, ep, provider, audio);
      if (result) {
        return Response.json(result);
      }
    }

    // Strategy 2: Fallback to AnikotoTV scraper (title-based)
    if (title || anilistId) {
      // If we only have an AniList ID, try to resolve a title from JustAnime info
      let searchTitle = title;
      if (!searchTitle && anilistId) {
        try {
          const infoRes = await fetch(
            `${JUSTANIME_API}/anime/${anilistId}`,
            { headers: JUSTANIME_HEADERS, signal: AbortSignal.timeout(5000) }
          );
          if (infoRes.ok) {
            const info = await infoRes.json();
            searchTitle =
              info?.data?.title?.english || info?.data?.title?.romaji;
          }
        } catch {
          // ignore
        }
      }

      if (searchTitle) {
        // Try Anipub first
        const anipubResult = await scrapeAnipub(searchTitle, ep);
        if (anipubResult) {
          return Response.json(anipubResult);
        }

        // Then Anikoto
        const fallback = await scrapeAnikoto(searchTitle, ep);
        if (fallback) {
          return Response.json(fallback);
        }
      }
    }

    return Response.json(
      {
        error: "No streaming sources found across all providers",
        providers_tried: anilistId ? [...PROVIDERS, "anipub", "anikoto"] : ["anipub", "anikoto"],
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Scraper Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
