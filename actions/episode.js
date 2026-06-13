"use server";

const JUSTANIME_API = "https://core.justanime.to/api";
const JUSTANIME_HEADERS = {
  Origin: "https://www.justanime.to",
  Referer: "https://www.justanime.to/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
};

export const getEpisodes = async (id, title) => {
  if (!id || !title) return [];

  try {
    // Try AniZip first (good metadata: images, titles, descriptions)
    const aniZipEpisodes = await fetchEpisodesFromAniZip(id);
    if (aniZipEpisodes && aniZipEpisodes.length > 0) {
      return aniZipEpisodes;
    }

    // Fallback: use JustAnime's episode list (reliable, has image & description)
    const justAnimeEpisodes = await fetchEpisodesFromJustAnime(id);
    if (justAnimeEpisodes && justAnimeEpisodes.length > 0) {
      return justAnimeEpisodes;
    }

    return [];
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }
};

// ─── AniZip (primary metadata source) ─────────────────────────────
async function fetchEpisodesFromAniZip(id) {
  if (!id) return [];

  try {
    const response = await fetch(`https://api.ani.zip/mappings?anilist_id=${id}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];

    const data = await response.json();
    const rawEpisodes = Object.values(data?.episodes || []);
    if (rawEpisodes.length === 0) return [];

    return rawEpisodes.map((meta, index) => {
      const episodeNum = meta.number || meta.episode || (index + 1);

      let epTitle = `Episode ${episodeNum}`;
      if (meta.title) {
        if (typeof meta.title === "object") {
          epTitle = meta.title.en || meta.title["x-jat"] || epTitle;
        } else {
          epTitle = meta.title;
        }
      }

      return {
        id: `ep-${episodeNum}`,
        number: episodeNum,
        title: epTitle,
        image: meta.img || meta.image || null,
        description: meta.description || meta.overview || meta.summary || "",
        isSubbed: true,
        isDubbed: true,
      };
    }).sort((a, b) => a.number - b.number);
  } catch (error) {
    console.error("Error fetching from AniZip:", error.message);
    return [];
  }
}

// ─── JustAnime (fallback episode source) ──────────────────────────
async function fetchEpisodesFromJustAnime(id) {
  if (!id) return [];

  try {
    // JustAnime paginates episodes (100 per page)
    let allEpisodes = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage && page <= 20) {
      const url = page === 1
        ? `${JUSTANIME_API}/anime/${id}/episodes`
        : `${JUSTANIME_API}/anime/${id}/episodes?page=${page}`;

      const response = await fetch(url, {
        headers: JUSTANIME_HEADERS,
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) break;
      const data = await response.json();

      if (data.episodes && Array.isArray(data.episodes)) {
        allEpisodes.push(
          ...data.episodes.map((ep) => ({
            id: `ep-${ep.number}`,
            number: ep.number,
            title: ep.title || `Episode ${ep.number}`,
            image: ep.image || null,
            description: ep.description || "",
            isSubbed: true,
            isDubbed: true,
          }))
        );
      }

      hasNextPage = data.hasNextPage === true;
      page++;
    }

    return allEpisodes.sort((a, b) => a.number - b.number);
  } catch (error) {
    console.error("Error fetching from JustAnime:", error.message);
    return [];
  }
}
