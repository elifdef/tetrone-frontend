import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../../context/SocketContext';
import VideoPlayer from '../../ui/VideoPlayer';
import ProcessingSkeleton from './ProcessingSkeleton';
import MediaAttachmentDebugBar from '../../ui/MediaAttachmentDebugBar';
import { EyeOffIcon } from '../../ui/Icons.jsx';

const ProtectedVideo = ({ video, children }) => {
    const { t } = useTranslation();
    const [revealed, setRevealed] = useState(false);

    const isHidden = (video.is_nsfw || video.is_spoiler) && !revealed;

    if (!isHidden) return children;

    return (
        <div
            className="relative w-full aspect-video bg-black flex flex-col items-center justify-center cursor-pointer group border border-border"
            onClick={() => setRevealed(true)}
        >
            {video.cover_url && (
                <img src={video.cover_url} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110" alt="" />
            )}

            <div className="relative z-10 flex flex-col items-center">
                {video.is_nsfw ? (
                    <div className="bg-theme-error px-[12px] py-[6px] rounded-[4px] font-bold text-[18px] shadow-lg mb-[10px] text-white">
                        {t('post.nsfw_badge')}
                    </div>
                ) : (
                    <div className="bg-[rgba(0,0,0,0.6)] p-[12px] rounded-[50%] mb-[10px] text-white">
                        <EyeOffIcon width={32} height={32} />
                    </div>
                )}
                <span className="text-[12px] font-bold uppercase tracking-wider text-white group-hover:underline">
                    {t('post.click_to_reveal')}
                </span>
            </div>
        </div>
    );
};

const LocalVideoItem = ({ video }) => {
    const { t } = useTranslation();
    const socketContext = useSocket();
    const socket = socketContext?.socket;
    const [videoData, setVideoData] = useState(video);

    useEffect(() => {
        setVideoData(video);
    }, [video]);

    useEffect(() => {
        if (!socket || videoData?.status !== 'processing') return undefined;

        const handleReady = (data) => {
            if (data && data.id === videoData.id) {
                setVideoData((prev) => ({
                    ...prev,
                    status: data.status || 'ready',
                    file_path: data.file_path ?? prev.file_path,
                    url: data.file_url || data.url || prev.url,
                    cover_url: data.cover_url ?? prev.cover_url,
                    file_size: data.file_size ?? prev.file_size,
                    meta: data.meta ?? prev.meta,
                }));
            }
        };

        socket.on('attachment.ready', handleReady);
        return () => {
            socket.off('attachment.ready', handleReady);
        };
    }, [socket, videoData?.id, videoData?.status]);

    if (!videoData) return null;

    const videoUrl = videoData.url || videoData.file_url || '';
    const status = videoData.status || (videoUrl ? 'ready' : 'processing');
    const isReady = status === 'ready' || videoUrl.includes('.m3u8');

    if (status === 'failed') {
        return (
            <div className="w-full flex flex-col">
                <div className="relative w-full aspect-video bg-bg-box border border-border flex items-center justify-center p-[12px] text-[11px] text-theme-error">
                    {t('api.error.ERR_UNKNOWN')}
                </div>
                <MediaAttachmentDebugBar attachment={videoData} />
            </div>
        );
    }

    if (status === 'processing' && !isReady) {
        return (
            <div className="w-full flex flex-col">
                <ProcessingSkeleton type="media" />
                <MediaAttachmentDebugBar attachment={videoData} />
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col">
            <ProtectedVideo video={videoData}>
                <div className="relative w-full bg-black border border-border overflow-hidden">
                    <VideoPlayer src={videoUrl} poster={videoData.cover_url || ''} className="w-full" />
                </div>
            </ProtectedVideo>
            <MediaAttachmentDebugBar attachment={videoData} />
        </div>
    );
};

export default function PostVideos({ localVideos = [], youtubeVideos = [] }) {
    const visibleYouTube = youtubeVideos.filter((yt) => !yt.isRemoved);

    if (localVideos.length === 0 && visibleYouTube.length === 0) return null;

    return (
        <div className="flex flex-col gap-[8px] mt-[8px]">
            {localVideos.map((video) => (
                <LocalVideoItem key={`loc-${video.id}`} video={video} />
            ))}

            {visibleYouTube.map((yt) => (
                <div key={yt.id} className="relative w-full aspect-video border border-border bg-black">
                    <VideoPlayer src={yt.videoId} provider="youtube" />
                </div>
            ))}
        </div>
    );
}