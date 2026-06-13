// Fetch watch data from our multi-provider scraper API
// Supports AniList ID-based lookup (primary) and title-based fallback
export const fetchWatchData = async (animeId, ep, isDub = false, provider = null) => {
  try {
    const params = new URLSearchParams({
      id: String(animeId),
      ep: String(ep),
      audio: isDub ? "dub" : "sub",
    });

    if (provider) {
      params.set("provider", provider);
    }

    const response = await fetch(`/api/anime/scrape?${params.toString()}`);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.sources || data.sources.length === 0) {
      console.warn(`No sources returned for ep ${ep}`);
      return { sources: [], provider: data.provider || "unknown" };
    }

    // Normalize to the format the player expects
    return {
      episodeId: `ep-${ep}`,
      provider: data.provider || "unknown",
      audioType: data.audioType || (isDub ? "dub" : "sub"),
      sources: data.sources.map((s) => ({
        url: s.url,
        quality: s.quality || "auto",
        isM3U8: s.isM3U8 ?? s.url?.includes(".m3u8") ?? true,
        headers: s.headers || data.headers || null,
      })),
      subtitles:
        (data.subtitles || []).map((sub) => ({
          url: sub.file || sub.url,
          lang: sub.label || sub.language || "English",
          kind: sub.kind || "captions",
          default: sub.default || false,
        })) || [],
      intro: data.intro || null,
      outro: data.outro || null,
    };
  } catch (error) {
    console.error(`Error fetching streaming data for episode ${ep}:`, error.message);
    return { sources: [], provider: "error" };
  }
};

// Fetch available providers for an anime episode
export const AVAILABLE_PROVIDERS = [
  { id: "megaplay", name: "MegaPlay", icon: "🎬" },
  { id: "animepahe", name: "AnimePahe", icon: "🎞️" },
  { id: "miruro", name: "Miruro", icon: "🌊" },
  { id: "animegg", name: "AnimeGG", icon: "🥚" },
  { id: "anikoto", name: "Anikoto", icon: "🎯" },
];