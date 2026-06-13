"use client";

import { fetchWatchData } from "@/lib/StreamingVideo";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";

export const WatchAreaContext = createContext();

export function WatchAreaContextProvider({ children, AnimeInfo }) {
  const searchparam = useSearchParams();

  const [episode, setEpisode] = useState(() => {
    const epFromSearch = parseInt(searchparam.get("ep"));
    return !isNaN(epFromSearch) ? epFromSearch : 1;
  });

  const [watchInfo, setWatchInfo] = useState({ loading: true });
  const [isDub, setIsDub] = useState(false);
  const [episodes, setEpisodes] = useState("loading");
  const [server, setServer] = useState("sub");
  const [provider, setProvider] = useState(null); // null = auto (best available)

  const [sub, dub] = episodes !== "loading" && episodes.length > 0
    ? [episodes.filter(e => e?.isSubbed), episodes.filter(e => e?.isDubbed)]
    : [[], []];

  // Fetch streaming data when episode, server, or provider changes
  useEffect(() => {
    if (!episodes || episodes === "loading") return;

    const fetchData = async () => {
      try {
        setWatchInfo((prev) => ({ ...prev, loading: true }));

        if (episodes.length === 0) {
          toast("No Episodes found");
          return;
        }

        const currentEpisode = episodes.find((ep) => ep.number === episode);
        if (!currentEpisode) {
          toast("Episode not found");
          return;
        }

        // Use AniList ID for provider resolution (much more reliable than title search)
        const animeId = AnimeInfo?.id;
        const isDubRequested = server === "dub";

        const [watchData, episodeData] = await Promise.all([
          fetchWatchData(animeId, episode, isDubRequested, provider),
          findEpisodeData(isDubRequested ? dub : sub, episode),
        ]);

        if (watchData?.sources?.length > 0 && watchData.provider) {
          console.log(`✅ Playing from provider: ${watchData.provider} (${watchData.audioType})`);
        }

        setWatchInfo({
          watchData,
          thumbnail: episodeData?.image || "",
          title: episodeData?.title || `Episode ${episode}`,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch watch info:", error);
        toast("Failed to load episode data");
        setWatchInfo((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [episode, server, episodes, provider]);

  // Restore episode from watch history
  useEffect(() => {
    if (typeof window !== "undefined") {
      const watchHistory = JSON.parse(localStorage.getItem("watch_history")) || {};
      const animeHistory = watchHistory?.[AnimeInfo?.id];
      const epFromHistory = parseInt(animeHistory?.episode);

      if (!isNaN(epFromHistory) && !searchparam.get("ep")) {
        setEpisode(epFromHistory);
      }
    }
  }, [AnimeInfo?.id, episodes]);

  const findEpisodeData = (selectedList, episodeNumber) => {
    return selectedList?.find((item) => item.number === episodeNumber);
  };

  // Allow switching providers on-the-fly
  const switchProvider = useCallback((newProvider) => {
    setProvider(newProvider === "auto" ? null : newProvider);
  }, []);

  const contextValue = useMemo(
    () => ({
      episode,
      watchInfo,
      setEpisode,
      setIsDub,
      isDub,
      setEpisodes,
      episodes,
      AnimeInfo,
      server,
      setServer,
      provider,
      switchProvider,
      animeid: AnimeInfo?.id,
    }),
    [episode, watchInfo, isDub, episodes, server, setServer, provider, switchProvider, AnimeInfo]
  );

  return (
    <WatchAreaContext.Provider value={contextValue}>
      {children}
    </WatchAreaContext.Provider>
  );
}

export function useWatchContext() {
  return useContext(WatchAreaContext);
}
