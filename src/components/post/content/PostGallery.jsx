import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeOffIcon} from "../../ui/Icons.jsx";

// Компонент-обгортка для обробки блюру
const GalleryImage = ({ media, onClick, extraCount, isLast }) => {
    const { t } = useTranslation();
    const [revealed, setRevealed] = useState(false);

    const isHidden = (media.is_nsfw || media.is_spoiler) && !revealed;

    const handleClick = (e) => {
        if (isHidden) {
            e.stopPropagation();
            setRevealed(true);
        } else {
            onClick(media.id);
        }
    };

    return (
        <div className="relative w-full h-full cursor-pointer bg-black overflow-hidden group" onClick={handleClick}>
            <img
                src={media.url}
                alt=""
                className={`w-full h-full object-cover transition-all duration-300 ${isHidden ? 'blur-xl opacity-70 scale-110' : 'hover:opacity-90'} ${isLast && extraCount > 0 && !isHidden ? 'opacity-40' : ''}`}
            />

            {/* Оверлей-заглушка */}
            {isHidden && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-[10px] text-center z-10 bg-[rgba(0,0,0,0.3)]">
                    {media.is_nsfw ? (
                        <div className="bg-theme-error px-[10px] py-[4px] rounded-[4px] font-bold text-[16px] shadow-lg mb-[8px]">
                            {t('post.nsfw_badge', '18+')}
                        </div>
                    ) : (
                        <div className="bg-[rgba(0,0,0,0.6)] p-[8px] rounded-[50%] mb-[8px]">
                            <EyeOffIcon width={24} height={24} />
                        </div>
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-wider">{t('post.click_to_reveal', 'Показати')}</span>
                </div>
            )}

            {/* Лічильник +X для останнього фото */}
            {isLast && extraCount > 0 && !isHidden && (
                <div className="absolute inset-0 flex items-center justify-center text-white font-tahoma font-bold text-[20px] drop-shadow-md z-10 pointer-events-none">
                    +{extraCount}
                </div>
            )}
        </div>
    );
};

export default function PostGallery({ images = [], onMediaClick }) {
    if (images.length === 0) return null;

    const count = images.length;

    if (count === 1) {
        return (
            <div className="mt-[8px] w-full border border-border bg-[rgba(128,128,128,0.05)] flex justify-center overflow-hidden h-[300px] sm:h-[400px]">
                <GalleryImage media={images[0]} onClick={onMediaClick} />
            </div>
        );
    }

    const renderGrid = () => {
        if (count === 2) {
            return (
                <div className="grid grid-cols-2 gap-[2px] h-[250px] sm:h-[300px]">
                    {images.map(media => <GalleryImage key={media.id} media={media} onClick={onMediaClick} />)}
                </div>
            );
        }

        if (count === 3) {
            return (
                <div className="grid grid-cols-2 gap-[2px] h-[300px] sm:h-[400px]">
                    <GalleryImage media={images[0]} onClick={onMediaClick} />
                    <div className="flex flex-col gap-[2px] h-full">
                        <GalleryImage media={images[1]} onClick={onMediaClick} />
                        <GalleryImage media={images[2]} onClick={onMediaClick} />
                    </div>
                </div>
            );
        }

        if (count === 4) {
            return (
                <div className="grid grid-cols-2 gap-[2px] h-[300px] sm:h-[400px]">
                    {images.map(media => <GalleryImage key={media.id} media={media} onClick={onMediaClick} />)}
                </div>
            );
        }

        const topImages = images.slice(0, 2);
        const bottomImages = images.slice(2, 5);
        const extraCount = count - 5;

        return (
            <div className="flex flex-col gap-[2px]">
                <div className="grid grid-cols-2 gap-[2px] h-[180px] sm:h-[220px]">
                    {topImages.map(media => <GalleryImage key={media.id} media={media} onClick={onMediaClick} />)}
                </div>
                <div className="grid grid-cols-3 gap-[2px] h-[120px] sm:h-[150px]">
                    {bottomImages.map((media, idx) => (
                        <GalleryImage key={media.id} media={media} onClick={onMediaClick} extraCount={extraCount} isLast={idx === 2} />
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