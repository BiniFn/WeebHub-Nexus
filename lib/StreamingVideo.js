// Fetch watch data, including streaming data and optional skip times
export const fetchWatchData = async (title, ep, isdub = false) => {
  try {
    try {
      const response = await fetch(`/api/anime/scrape?title=${encodeURIComponent(title)}&ep=${ep}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} (${response.statusText})`);
      }

      const data = await response.json();
      
      // Map to expected format for the player
      return { 
        episodeId: `ep-${ep}`,
        sources: [{ url: data.url, isM3U8: data.url?.includes('.m3u8') || true }],
        subtitles: data.subtitles?.map(sub => ({ url: sub.file, lang: sub.label || sub.language || 'English' })) || []
      };
    } catch (error) {
      console.error(`Error fetching streaming data for episode ${ep}:`, error.message);
      return { sources: [] };
    }


  } catch (error) {
    console.error('Error fetching watch data:', error.message);
    throw error;
  }
};