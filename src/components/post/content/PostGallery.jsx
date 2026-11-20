import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeOffIcon } from "../../ui/Icons.jsx";

const getInitialRatio = (media) => {
    const w = Number(media?.width || media?.meta?.width || 0);
    const h = Number(media?.height || media?.meta?.height || 0);
    return w > 0 && h > 0 ? w / h : null;
};

const GalleryImage = ({ media, onClick, onMeasure, extraCount, isLast, singleMode = false, dims }) => {
    const { t } = useTranslation();
    const [revealed, setRevealed] = useState(false);

    const isHidden = (media.is_nsfw || media.is_spoiler) && !revealed;
    const mediaKey = media.id ?? media.url;

    const handleClick = (e) => {
        if (isHidden) {
            e.stopPropagation();
            setRevealed(true);
        } else {
            onClick(mediaKey);
        }
    };

    const handleLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth > 0 && naturalHeight > 0 && onMeasure) {
            onMeasure(mediaKey, naturalWidth, naturalHeight);
        }
    };

    const isSmallSingle = singleMode && dims && dims.width < 360 && dims.height < 360;

    return (
        <div
            className={`relative cursor-pointer overflow-hidden group ${
                singleMode
                    ? 'w-full flex items-center justify-center bg-[rgba(0,0,0,0.25)]'
                    : 'w-full h-full bg-black'
            }`}
            onClick={handleClick}
        >
            <img
                src={media.url}
                alt=""
                loading="lazy"
                onLoad={handleLoad}
                className={`transition-all duration-300 block ${
                    singleMode
                        ? `${isSmallSingle ? 'w-auto h-auto max-w-full' : 'w-full h-auto'} max-h-[560px] max-sm:max-h-[420px] object-contain`
                        : 'w-full h-full object-cover object-top'
                } ${
                    isHidden ? 'blur-xl opacity-70 scale-110' : 'hover:opacity-95'
                } ${
                    isLast && extraCount > 0 && !isHidden ? 'opacity-40' : ''
                }`}
            />

            {isHidden && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-[10px] text-center z-10 bg-[rgba(0,0,0,0.35)]">
                    {media.is_nsfw ? (
                        <div className="bg-theme-error px-[10px] py-[4px] rounded-[4px] font-bold text-[16px] shadow-lg mb-[8px]">
                            {t('post.nsfw_badge')}
                        </div>
                    ) : (
                        <div className="bg-[rgba(0,0,0,0.6)] p-[8px] rounded-[50%] mb-[8px]">
                            <EyeOffIcon width={24} height={24} />
                        </div>
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                        {t('post.click_to_reveal')}
                    </span>
                </div>
            )}

            {isLast && extraCount > 0 && !isHidden && (
                <div className="absolute inset-0 flex items-center justify-center text-white font-tahoma font-bold text-[20px] drop-shadow-md z-10 pointer-events-none">
                    +{extraCount}
                </div>
            )}
        </div>
    );
};

export default function PostGallery({ images = [], onMediaClick }) {
    const [measured, setMeasured] = useState({});

    const handleMeasure = useCallback((key, width, height) => {
        setMeasured(prev => {
            const existing = prev[key];
            if (existing && existing.width === width && existing.height === height) {
                return prev;
            }
            return { ...prev, [key]: { width, height, ratio: width / height } };
        });
    }, []);

    const ratios = useMemo(() => {
        return images.map(img => {
            const key = img.id ?? img.url;
            return measured[key]?.ratio ?? getInitialRatio(img) ?? 1.25;
        });
    }, [images, measured]);

    if (images.length === 0) return null;

    const count = images.length;

    if (count === 1) {
        const firstKey = images[0].id ?? images[0].url;
        return (
            <div className="mt-[8px] w-full border border-border overflow-hidden">
                <GalleryImage
                    media={images[0]}
                    onClick={onMediaClick}
                    onMeasure={handleMeasure}
                    singleMode={true}
                    dims={measured[firstKey]}
                />
            </div>
        );
    }

    const renderGrid = () => {
        if (count === 2) {
            const avgRatio = (ratios[0] + ratios[1]) / 2;
            if (avgRatio > 1.45) {
                return (
                    <div className="grid grid-cols-1 gap-[2px]">
                        {images.map(media => (
                            <div key={media.id ?? media.url} className="aspect-[16/9] max-h-[260px] overflow-hidden">
                                <GalleryImage media={media} onClick={onMediaClick} onMeasure={handleMeasure} />
                            </div>
                        ))}
                    </div>
                );
            }

            const cellAspect = avgRatio < 0.85 ? 'aspect-[3/4]' : 'aspect-[4/3]';
            return (
                <div className="grid grid-cols-2 gap-[2px]">
                    {images.map(media => (
                        <div key={media.id ?? media.url} className={`${cellAspect} max-h-[380px] overflow-hidden`}>
                            <GalleryImage media={media} onClick={onMediaClick} onMeasure={handleMeasure} />
                        </div>
                    ))}
                </div>
            );
        }

        if (count === 3) {
            const firstIsWide = ratios[0] > 1.3;
            if (firstIsWide) {
                return (
                    <div className="flex flex-col gap-[2px]">
                        <div className="aspect-[16/9] max-h-[280px] overflow-hidden">
                            <GalleryImage media={images[0]} onClick={onMediaClick} onMeasure={handleMeasure} />
                        </div>
                        <div className="grid grid-cols-2 gap-[2px]">
                            {images.slice(1, 3).map(media => (
                                <div key={media.id ?? media.url} className="aspect-[4/3] max-h-[200px] overflow-hidden">
                                    <GalleryImage media={media} onClick={onMediaClick} onMeasure={handleMeasure} />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            return (
                <div className="grid grid-cols-2 gap-[2px] h-[300px] sm:h-[400px]">
                    <GalleryImage media={images[0]} onClick={onMediaClick} onMeasure={handleMeasure} />
                    <div className="grid grid-rows-2 gap-[2px] h-full min-h-0">
                        <GalleryImage media={images[1]} onClick={onMediaClick} onMeasure={handleMeasure} />
                        <GalleryImage media={images[2]} onClick={onMediaClick} onMeasure={handleMeasure} />
                    </div>
                </div>
            );
        }

        if (count === 4) {
            const avgRatio = ratios.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
            const cellAspect = avgRatio > 1.2 ? 'aspect-[4/3]' : 'aspect-square';
            return (
                <div className="grid grid-cols-2 gap-[2px]">
                    {images.map(media => (
                        <div key={media.id ?? media.url} className={`${cellAspect} max-h-[250px] overflow-hidden`}>
                            <GalleryImage media={media} onClick={onMediaClick} onMeasure={handleMeasure} />
                        </div>
                    ))}
                </div>
            );
        }

        const topImages = images.slice(0, 2);
        const bottomImages = images.slice(2, 5);
        const extraCount = count - 5;

        return (
            <div className="flex flex-col gap-[2px]">
                <div className="grid grid-cols-2 gap-[2px]">
                    {topImages.map(media => (
                        <div key={media.id ?? media.url} className="aspect-[4/3] max-h-[220px] overflow-hidden">
                            <GalleryImage media={media} onClick={onMediaClick} onMeasure={handleMeasure} />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-[2px]">
                    {bottomImages.map((media, idx) => (
                        <div key={media.id ?? media.url} className="aspect-square max-h-[150px] overflow-hidden">
                            <GalleryImage
                                media={media}
                                onClick={onMediaClick}
                                onMeasure={handleMeasure}
                                extraCount={extraCount}
                                isLast={idx === 2}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-[8px] overflow-hidden border border-border bg-border">
            {renderGrid()}
        </div>
    );
}