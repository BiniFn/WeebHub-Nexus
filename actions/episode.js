"use server";
import { getMappings } from "./mapping";

export const getEpisodes = async (id, title) => {
  if (!id || !title) return [];

  try {
    const coverMeta = await fetchEpisodeMeta(id);
    if (!coverMeta || coverMeta.length === 0) return [];

    // Construct the episode array natively from AniZip metadata
    const episodes = coverMeta.map((meta, index) => {
      const episodeNum = meta.number || meta.episode || (index + 1);
      
      let epTitle = `Episode ${episodeNum}`;
      if (meta.title) {
        if (typeof meta.title === 'object') {
          epTitle = meta.title.en || meta.title['x-jat'] || epTitle;
        } else {
          epTitle = meta.title;
        }
      }

      return {
        id: `ep-${episodeNum}`,
        number: episodeNum,
        title: epTitle,
        image: meta.img || meta.image || null,
        description: meta.description || meta.overview || meta.summary || '',
        isSubbed: true,
        isDubbed: true
      };
    });

    return episodes.sort((a, b) => a.number - b.number);
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }
};

async function fetchEpisodeMeta(id) {
  if (!id) return [];

  try {
    const response = await fetch(`https://api.ani.zip/mappings?anilist_id=${id}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    return Object.values(data?.episodes || []);
  } catch (error) {
    console.error("Error fetching episode metadata:", error);
    return [];
  }
}
