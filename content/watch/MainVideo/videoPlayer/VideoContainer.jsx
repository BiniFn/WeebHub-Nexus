import { AnimatePresence, motion } from 'framer-motion';
import LoadingVideo from '@/components/loadings/loadingVideo/loadingVideo';
import useArtplayer from './useArtplayer';
import { useWatchContext } from '@/context/Watch';
import { useWatchSettingContext } from '@/context/WatchSetting';
import "./video_player.css"
import clsx from 'clsx';

const VideoPlayerContainer = ({ getInstance }) => {
  const artRef = useArtplayer(getInstance);
  const { watchInfo } = useWatchContext();
  const { watchSetting, setWatchSetting } = useWatchSettingContext();

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
            <div ref={artRef} className="w-full h-full"></div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1921] p-6 text-center rounded-md border border-[#ffffff10]">
              <div className="text-3xl mb-4">📺</div>
              <h3 className="text-xl font-medium text-white mb-2">Video Stream Unavailable</h3>
              <p className="text-gray-400 mb-6 max-w-md">The internal streaming server is currently experiencing issues. You can watch this episode externally on these supported platforms:</p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <a 
                  href={`https://mkissa.to/search?keyword=${encodeURIComponent(watchInfo?.title || '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-[#242735] hover:bg-[#2a2d3d] border border-[#39374b] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  Watch on MKissa
                </a>
                <a 
                  href={`https://animepahe.pw/`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-[#242735] hover:bg-[#2a2d3d] border border-[#39374b] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  Watch on AnimePahe
                </a>
                <a 
                  href={`https://hianime.to/search?keyword=${encodeURIComponent(watchInfo?.title || '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-[#242735] hover:bg-[#2a2d3d] border border-[#39374b] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  Watch on HiAnime
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