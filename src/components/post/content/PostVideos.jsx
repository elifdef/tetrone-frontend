import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VideoPlayer from "../../ui/VideoPlayer";
import { EyeOffIcon } from "../../ui/Icons.jsx";

const ProtectedVideo = ({ video, children }) => {
    const { t } = useTranslation();
    const [revealed, setRevealed] = useState(false);

    // Перевіряємо, чи є відео прихованим
    const isHidden = (video.is_nsfw || video.is_spoiler) && !revealed;

    if (!isHidden) return children;

    return (
        <div
            className="relative w-full aspect-video bg-black flex flex-col items-center justify-center cursor-pointer group border border-border"
            onClick={() => setRevealed(true)}
        >
            {/* Фейковий блюр на основі обкладинки, якщо вона є */}
            {video.cover_url && (
                <img src={video.cover_url} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110" alt="" />
            )}

            <div className="relative z-10 flex flex-col items-center">
                {video.is_nsfw ? (
                    <div className="bg-theme-error px-[12px] py-[6px] rounded-[4px] font-bold text-[18px] shadow-lg mb-[10px] text-white">
                        {t('post.nsfw_badge', '18+')}
                    </div>
                ) : (
                    <div className="bg-[rgba(0,0,0,0.6)] p-[12px] rounded-[50%] mb-[10px] text-white">
                        <EyeOffIcon width={32} height={32} />
                    </div>
                )}
                <span className="text-[12px] font-bold uppercase tracking-wider text-white group-hover:underline">
                    {t('post.click_to_reveal', 'Показати')}
                </span>
            </div>
        </div>
    );
};

export default function PostVideos({ localVideos = [], youtubeVideos = [] }) {
    const visibleYouTube = youtubeVideos.filter(yt => !yt.isRemoved);

    if (localVideos.length === 0 && visibleYouTube.length === 0) return null;

    return (
        <div className="flex flex-col gap-[8px] mt-[8px]">
            {localVideos.map((video) => (
                <ProtectedVideo key={`loc-${video.id}`} video={video}>
                    <div className="relative w-full flex justify-center bg-black border border-border overflow-hidden">
                        <VideoPlayer src={video.url} className="w-full max-h-[75vh]" />
                    </div>
                </ProtectedVideo>
            ))}

            {visibleYouTube.map((yt) => (
                <div key={yt.id} className="relative w-full aspect-video border border-border bg-black">
                    <VideoPlayer src={yt.videoId} provider="youtube" />
                </div>
            ))}
        </div>
    );
}