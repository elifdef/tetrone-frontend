import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTranslation } from 'react-i18next';
import Avatar from '../../ui/Avatar';
import UserDisplayName from '../../ui/UserDisplayName';
import { LikeIcon, CommentIcon, RepostIcon } from '../../ui/Icons';

const NOISE_SVG_DATA_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const AnimatedNoiseOverlay = () => (
    <>
        <style>{`
            @keyframes tetrone-static-noise {
                0% { transform: translate(0, 0); }
                25% { transform: translate(-8px, 6px); }
                50% { transform: translate(6px, -8px); }
                75% { transform: translate(-4px, -6px); }
                100% { transform: translate(8px, 4px); }
            }
        `}</style>
        <div
            aria-hidden="true"
            className="absolute -inset-[16px] opacity-[0.16] pointer-events-none mix-blend-overlay"
            style={{
                backgroundImage: NOISE_SVG_DATA_URI,
                backgroundSize: '160px 160px',
                animation: 'tetrone-static-noise 0.35s steps(2) infinite'
            }}
        />
    </>
);

const classifyPendingFiles = (files = []) => {
    const visual = [];
    const audios = [];
    const docs = [];

    files.forEach((f) => {
        const type = String(f.type || '').toLowerCase();
        const name = String(f.name || '').toLowerCase();

        if (type.startsWith('image/') || type.startsWith('video/') || /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|mkv|avi)$/i.test(name)) {
            visual.push(f);
        } else if (type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(name)) {
            audios.push(f);
        } else {
            docs.push(f);
        }
    });

    return { visual, audios, docs };
};

export default function ProcessingSkeleton({ type = 'media', label = null, author = null, doc = null, pendingMeta = null }) {
    const { t } = useTranslation();

    const { visual, audios, docs } = classifyPendingFiles(pendingMeta?.files || []);
    const showTextLines = pendingMeta ? pendingMeta.hasText : true;
    const showDefaultVisual = !pendingMeta;

    return (
        <SkeletonTheme
            baseColor="var(--bg-input, #252525)"
            highlightColor="var(--border-color, #383838)"
            borderRadius={0}
        >
            {type === 'post' ? (
                <div className="mt-[10px] first:border-t-0 first:pt-[5px] max-md:mx-[-10px] max-md:border-x-0">
                    <div className="flex flex-col pt-[5px]">
                        <div className="border-t border-border pt-[5px] flex items-start max-md:px-[10px] max-md:items-center">
                            {author ? (
                                <>
                                    <div className="shrink-0 mr-[10px]">
                                        <Avatar user={author} className="w-[50px] h-[50px] object-cover block" />
                                    </div>
                                    <div className="flex flex-col text-[11px] flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-[4px] leading-[1.4]">
                                            <span className="text-theme-link">
                                                <UserDisplayName user={author} showUsername={false} className="text-[12px]" />
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-[4px] mt-[2px] text-[10px] text-text-muted">
                                            <span>{label || t('post.uploading_media')}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="shrink-0 mr-[10px]">
                                        <Skeleton width={50} height={50} />
                                    </div>
                                    <div className="flex flex-col gap-[4px] flex-1 min-w-0">
                                        <Skeleton width={140} height={12} />
                                        <Skeleton width={90} height={10} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="text-[11px] leading-[1.4] pl-[60px] mt-[5px] mb-[5px] max-md:pl-[10px] max-md:mt-[10px]">
                        {showTextLines && (
                            <div className="flex flex-col gap-[5px] mb-[8px]">
                                <Skeleton width="78%" height={11} />
                                <Skeleton width="52%" height={11} />
                            </div>
                        )}

                        {(visual.length > 0 || showDefaultVisual) && (
                            <div className="relative w-full h-[240px] border border-border overflow-hidden mt-[8px]">
                                <Skeleton height="100%" width="100%" containerClassName="block w-full h-full leading-none" />
                                <AnimatedNoiseOverlay />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="bg-bg-box/85 border border-border px-[10px] py-[4px] text-[11px] text-text-muted">
                                        {label || t('post.uploading_media')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {(audios.length > 0 || docs.length > 0) && (
                            <div className="flex flex-col gap-[6px] mt-[10px] pt-[5px] border-t border-dashed border-border">
                                {audios.map((audioFile, idx) => (
                                    <div key={`pending-audio-${idx}`} className="w-full flex items-center p-[6px] border rounded-none bg-bg-page border-border relative overflow-hidden">
                                        <div className="w-[36px] h-[36px] shrink-0 mr-[8px] border border-border relative overflow-hidden">
                                            <Skeleton height="100%" width="100%" containerClassName="block w-full h-full leading-none" />
                                            <AnimatedNoiseOverlay />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1 justify-center gap-[3px]">
                                            <span className="text-[11px] font-bold text-text-muted truncate">
                                                {audioFile.name}
                                            </span>
                                            <span className="text-[9px] text-text-muted mt-[1px]">
                                                {label || t('post.uploading_media')}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {docs.map((docFile, idx) => (
                                    <div key={`pending-doc-${idx}`} className="flex items-center py-[4px] px-[2px] gap-[8px]">
                                        <div className="w-[24px] h-[24px] shrink-0 relative overflow-hidden border border-border">
                                            <Skeleton height="100%" width="100%" containerClassName="block w-full h-full leading-none" />
                                            <AnimatedNoiseOverlay />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1 gap-[2px]">
                                            <span className="text-[11px] font-bold text-text-muted truncate">
                                                {docFile.name}
                                            </span>
                                            <span className="text-[9px] text-text-muted">
                                                {label || t('post.uploading_media')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col pb-[10px] px-[15px] pl-[60px] mt-0 max-md:px-[10px] opacity-40 pointer-events-none select-none">
                        <div className="flex gap-[15px] items-center pt-[10px] flex-wrap relative w-full text-theme-link text-[11px] font-bold">
                            <span className="flex items-center gap-[6px]">
                                <LikeIcon width={16} height={16} className="block" /> 0
                            </span>
                            <span className="flex items-center gap-[6px]">
                                <CommentIcon width={16} height={16} className="block" /> 0
                            </span>
                            <span className="flex items-center gap-[6px]">
                                <RepostIcon width={16} height={16} className="block" /> 0
                            </span>
                        </div>
                    </div>
                </div>
            ) : type === 'audio' ? (
                <div className="w-full flex items-center p-[6px] border rounded-none bg-bg-page border-border relative overflow-hidden">
                    <div className="w-[36px] h-[36px] shrink-0 mr-[8px] border border-border relative overflow-hidden">
                        <Skeleton height="100%" width="100%" containerClassName="block w-full h-full leading-none" />
                        <AnimatedNoiseOverlay />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center gap-[3px]">
                        {doc?.original_name || doc?.file_name || doc?.name ? (
                            <span className="text-[11px] font-bold text-text-muted truncate">
                                {doc.original_name || doc.file_name || doc.name}
                            </span>
                        ) : (
                            <Skeleton width="55%" height={11} />
                        )}
                        <span className="text-[9px] text-text-muted mt-[1px]">
                            {label || t('post.processing_media')}
                        </span>
                    </div>
                </div>
            ) : type === 'document' ? (
                <div className="flex items-center gap-[10px] p-[8px_10px] bg-bg-page border border-border relative overflow-hidden">
                    <div className="w-[32px] h-[32px] shrink-0 relative overflow-hidden">
                        <Skeleton height="100%" width="100%" containerClassName="block w-full h-full leading-none" />
                        <AnimatedNoiseOverlay />
                    </div>
                    <div className="flex flex-col gap-[4px] flex-1 min-w-0">
                        <Skeleton width="60%" height={11} />
                        <Skeleton width="30%" height={9} />
                    </div>
                </div>
            ) : (
                <div className="relative w-full h-[240px] border border-border overflow-hidden">
                    <Skeleton height="100%" width="100%" containerClassName="block w-full h-full leading-none" />
                    <AnimatedNoiseOverlay />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="bg-bg-box/85 border border-border px-[10px] py-[4px] text-[11px] text-text-muted">
                            {label || t('post.processing_media')}
                        </span>
                    </div>
                </div>
            )}
        </SkeletonTheme>
    );
}