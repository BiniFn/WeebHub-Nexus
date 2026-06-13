import { AnimatePresence, motion } from 'framer-motion';
import LoadingVideo from '@/components/loadings/loadingVideo/loadingVideo';
import useArtplayer from './useArtplayer';
import { useWatchContext } from '@/context/Watch';
import { useWatchSettingContext } from '@/context/WatchSetting';
import { AVAILABLE_PROVIDERS } from '@/lib/StreamingVideo';
import "./video_player.css"
import clsx from 'clsx';
import { useState } from 'react';

const VideoPlayerContainer = ({ getInstance }) => {
  const artRef = useArtplayer(getInstance);
  const { watchInfo, provider, switchProvider } = useWatchContext();
  const { watchSetting, setWatchSetting } = useWatchSettingContext();
  const [showProviders, setShowProviders] = useState(false);

  const activeProvider = watchInfo?.watchData?.provider || provider || "auto";

  return (
    <>
      <div className='z-30'>
        <motion.div
          className={clsx({
            'min-[1300px]:fixed min-[1300px]:max-w-[1156px] min-[1300px]:w-full min-[1300px]:aspect-video min-[1300px]:top-1/2 min-[1300px]:left-1/2 min-[1300px]:-translate-x-1/2 min-[1300px]:-translate-y-1/2': watchSetting.light,
            'aspect-video w-full relative bg-black rounded-md overflow-hidden': !watchSetting.light
          })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {watchInfo?.loading ? (
            <LoadingVideo />
          ) : watchInfo?.watchData?.sources?.length > 0 ? (
            <>
              {watchInfo?.watchData?.sources?.[0]?.isIframe ? (
                <iframe 
                  src={watchInfo.watchData.sources[0].url}
                  className="w-full h-full border-0 bg-black"
                  allowFullScreen
                ></iframe>
              ) : (
                <div ref={artRef} className="w-full h-full bg-black"></div>
              )}
              {/* Provider Badge */}
              <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
                <button
                  onClick={() => setShowProviders(!showProviders)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm border border-white/10 text-[11px] font-medium text-white/80 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                  title="Switch streaming provider"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {activeProvider.toUpperCase()}
                  <svg className={`w-3 h-3 transition-transform ${showProviders ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showProviders && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-1.5 bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-2xl min-w-[160px]"
                    >
                      <div className="px-3 py-1.5 border-b border-white/5">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Providers</span>
                      </div>
                      {AVAILABLE_PROVIDERS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchProvider(p.id);
                            setShowProviders(false);
                          }}
                          className={clsx(
                            "w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left",
                            activeProvider === p.id
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <span>{p.icon}</span>
                          <span className="font-medium">{p.name}</span>
                          {activeProvider === p.id && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          switchProvider("auto");
                          setShowProviders(false);
                        }}
                        className={clsx(
                          "w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors border-t border-white/5 text-left",
                          !provider
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span>🔄</span>
                        <span className="font-medium">Auto (Best)</span>
                        {!provider && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1921] p-6 text-center rounded-md border border-[#ffffff10]">
              <div className="text-3xl mb-4">📺</div>
              <h3 className="text-xl font-medium text-white mb-2">Video Stream Unavailable</h3>
              <p className="text-gray-400 mb-4 max-w-md">All streaming providers failed to load this episode. Try switching providers or try again later.</p>
              
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {AVAILABLE_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => switchProvider(p.id)}
                    className="bg-[#242735] hover:bg-[#2a2d3d] border border-[#39374b] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span>{p.icon}</span> Try {p.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <a 
                  href={`https://mkissa.to/search?keyword=${encodeURIComponent(watchInfo?.title || '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-[#242735] hover:bg-[#2a2d3d] border border-[#39374b] text-white/70 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  External: MKissa
                </a>
                <a 
                  href={`https://animeverse.to/search?q=${encodeURIComponent(watchInfo?.title || '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-[#242735] hover:bg-[#2a2d3d] border border-[#39374b] text-white/70 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  External: Animeverse
                </a>
              </div>
            </div>
          )}
        </motion.div>

        {watchSetting?.light && <div className='aspect-video w-full max-[1300px]:hidden'></div>}
      </div>

      <AnimatePresence>
        {watchSetting?.light ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed top-0 left-0 w-full h-full z-20 bg-[#000000e5]'
            onClick={() => setWatchSetting(prev => ({ ...prev, light: false }))}
          ></motion.div>
        ) : null}
      </AnimatePresence>

    </>
  );
};

export default VideoPlayerContainer;