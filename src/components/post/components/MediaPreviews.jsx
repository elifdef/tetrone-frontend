import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VideoPlayer from '../../ui/VideoPlayer';
import { DocumentIcon, EyeOffIcon, DotsIcon, EditIcon } from "../../ui/Icons"; // Додано EditIcon

export default function MediaPreviews({ previews, onRemove, onToggleFlag, onToggleNSFW, isExisting = false, onEditClick }) {
    const { t } = useTranslation();
    const [contextMenu, setContextMenu] = useState(null);
    const menuRef = useRef(null);

    const toggleHandler = onToggleFlag || onToggleNSFW;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (contextMenu && menuRef.current && !menuRef.current.contains(e.target)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu]);

    if (!previews || !Array.isArray(previews) || previews.length === 0) return null;

    const videos = [];
    const others = [];

    previews.forEach((preview, index) => {
        if (!preview) return;
        const typeStr = String(preview.type || '').toLowerCase();
        const nameStr = String(preview.name || preview.original_name || 'File');
        const isVideo = typeStr.includes('video') || /\.(mp4|mov|webm|mkv|avi)$/i.test(nameStr);
        const isImage = typeStr.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(nameStr);
        const isFileObject = preview instanceof File || preview instanceof Blob;

        const srcUrl = isFileObject ? URL.createObjectURL(preview) + '#t=0.1' : preview.url;
        const isSpoiler = preview.is_spoiler === true;
        const isNsfw = preview.is_nsfw === true;

        const item = { preview, index, nameStr, srcUrl, isImage, isSpoiler, isNsfw };
        if (isVideo) videos.push(item);
        else others.push(item);
    });

    const handleOpenMenu = (e, removeId, isSpoiler, isNsfw) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({ x: rect.left, y: rect.bottom + 5, id: removeId, isSpoiler, isNsfw });
    };

    const handleToggle = (e, flagType) => {
        e.preventDefault();
        e.stopPropagation();
        if (contextMenu && toggleHandler) {
            toggleHandler(contextMenu.id, flagType, isExisting);
            setContextMenu(null);
        }
    };

    const renderMenu = () => {
        if (!contextMenu) return null;
        return (
            <div
                ref={menuRef}
                className="fixed z-[9999] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] rounded-[2px] py-[4px] min-w-[160px]"
                style={{ top: contextMenu.y, left: contextMenu.x }}
            >
                <button
                    type="button"
                    className="w-full text-left px-[12px] py-[8px] flex items-center gap-[8px] text-[11px] outline-none cursor-pointer border-none bg-transparent whitespace-nowrap text-text-main hover:bg-bg-page hover:text-theme-link"
                    onClick={(e) => handleToggle(e, 'is_spoiler')}
                >
                    <EyeOffIcon width={14} height={14} />
                    {contextMenu.isSpoiler ? t('post.remove_spoiler') : t('post.add_spoiler')}
                </button>
                <div className="h-[1px] bg-border my-[2px]"></div>
                <button
                    type="button"
                    className="w-full text-left px-[12px] py-[8px] flex items-center gap-[8px] text-[11px] outline-none cursor-pointer border-none bg-transparent whitespace-nowrap text-theme-error hover:bg-[rgba(255,51,71,0.1)]"
                    onClick={(e) => handleToggle(e, 'is_nsfw')}
                >
                    <span className="font-bold">18+</span>
                    {contextMenu.isNsfw ? t('post.remove_nsfw_18') : t('post.add_nsfw_18')}
                </button>
            </div>
        );
    };

    const renderPreviewContent = (srcUrl, isImage, isSpoiler, isNsfw, nameStr) => {
        if (!isImage) {
            return (
                <div className="flex flex-col items-center justify-center w-[100px] h-[100px] p-[8px] text-center overflow-hidden">
                    <DocumentIcon width={24} height={24} className="text-text-muted" />
                    <span className="text-[12px] mt-[4px] whitespace-nowrap overflow-hidden text-ellipsis w-full text-text-main" title={nameStr}>{nameStr}</span>
                </div>
            );
        }

        const blurClass = isNsfw ? 'blur-xl scale-110' : (isSpoiler ? 'blur-md scale-105' : '');

        return (
            <>
                <img src={srcUrl} alt="" className={`w-[100px] h-[100px] object-cover block transition-all ${!isExisting ? 'opacity-80' : ''} ${blurClass}`} />

                {isNsfw && (
                    <div className="absolute bottom-[5px] left-[5px] pointer-events-none bg-theme-error text-white px-[4px] py-[2px] rounded-[2px] z-10 font-bold text-[10px] tracking-wider shadow-sm">
                        {t('post.nsfw_badge')}
                    </div>
                )}
                {isSpoiler && !isNsfw && (
                    <div className="absolute bottom-[5px] left-[5px] pointer-events-none bg-[rgba(0,0,0,0.6)] text-white p-[4px] rounded-[2px] z-10">
                        <EyeOffIcon width={12} height={12} />
                    </div>
                )}
            </>
        );
    };

    return (
        <>
            {renderMenu()}

            {others.length > 0 && (
                <div className="flex gap-[10px] flex-wrap mt-[10px]">
                    {others.map(({ preview, index, nameStr, srcUrl, isImage, isSpoiler, isNsfw }) => {
                        const removeId = isExisting ? preview.id : index;
                        const key = isExisting ? `exist-other-${preview.id}` : `new-other-${index}`;
                        return (
                            <div key={key} className={`relative inline-block my-[5px] border p-[2px] bg-bg-box overflow-hidden ${isExisting ? 'border-[2px] border-theme-success' : 'border-border'}`}>

                                <button type="button" className="absolute top-[5px] right-[5px] z-20 bg-[rgba(0,0,0,0.6)] text-white border-none cursor-pointer w-[20px] h-[20px] flex items-center justify-center text-[14px] leading-none hover:bg-theme-error outline-none transition-colors" onClick={() => onRemove(removeId)} title={t('action.delete')}>×</button>

                                {/* КНОПКА РЕДАГУВАННЯ ФОТО (Тільки для картинок і тільки якщо є onEditClick) */}
                                {isImage && onEditClick && (
                                    <button
                                        type="button"
                                        className="absolute top-[30px] right-[5px] z-20 bg-[rgba(0,0,0,0.6)] text-white border-none cursor-pointer w-[20px] h-[20px] flex items-center justify-center hover:bg-theme-link outline-none transition-colors"
                                        onClick={(e) => { e.stopPropagation(); onEditClick(index); }}
                                        title={t('action.edit')}
                                    >
                                        <EditIcon width={12} height={12} />
                                    </button>
                                )}

                                {isImage && toggleHandler && (
                                    <button
                                        type="button"
                                        className="absolute top-[5px] left-[5px] z-20 bg-[rgba(0,0,0,0.6)] text-white border-none cursor-pointer w-[20px] h-[20px] flex items-center justify-center hover:bg-theme-link outline-none transition-colors rounded-[2px]"
                                        onClick={(e) => handleOpenMenu(e, removeId, isSpoiler, isNsfw)}
                                        title={t('post.media_settings')}
                                    >
                                        <DotsIcon width={12} height={12} />
                                    </button>
                                )}

                                {renderPreviewContent(srcUrl, isImage, isSpoiler, isNsfw, nameStr)}
                            </div>
                        );
                    })}
                </div>
            )}

            {videos.length > 0 && (
                <div className="flex flex-col gap-[10px] mt-[10px]">
                    {videos.map(({ preview, index, srcUrl, isSpoiler, isNsfw }) => {
                        const removeId = isExisting ? preview.id : index;
                        const key = isExisting ? `exist-video-${preview.id}` : `new-video-${index}`;
                        const blurClass = isNsfw ? 'blur-2xl scale-110 pointer-events-none' : (isSpoiler ? 'blur-lg scale-105 pointer-events-none' : '');

                        return (
                            <div key={key} className="relative mt-[10px] w-full border border-border bg-black">
                                <button type="button" className="absolute top-[5px] right-[5px] z-30 bg-[rgba(0,0,0,0.6)] text-white border-none cursor-pointer w-[24px] h-[24px] flex items-center justify-center text-[16px] leading-none hover:bg-theme-error outline-none transition-colors" onClick={() => onRemove(removeId)} title={t('action.delete')}>×</button>

                                {toggleHandler && (
                                    <button
                                        type="button"
                                        className="absolute top-[5px] left-[5px] z-30 bg-[rgba(0,0,0,0.6)] text-white border-none cursor-pointer w-[24px] h-[24px] flex items-center justify-center hover:bg-theme-link outline-none transition-colors rounded-[2px]"
                                        onClick={(e) => handleOpenMenu(e, removeId, isSpoiler, isNsfw)}
                                    >
                                        <DotsIcon width={16} height={16} />
                                    </button>
                                )}

                                {isNsfw && <div className="absolute bottom-[10px] left-[10px] pointer-events-none bg-theme-error text-white px-[6px] py-[2px] rounded-[2px] z-20 font-bold text-[12px] tracking-wider shadow-sm">{t('post.nsfw_badge')}</div>}
                                {isSpoiler && !isNsfw && <div className="absolute bottom-[10px] left-[10px] pointer-events-none bg-[rgba(0,0,0,0.6)] text-white p-[6px] rounded-[2px] z-20"><EyeOffIcon width={16} height={16} /></div>}

                                <div className={`overflow-hidden w-full transition-all ${blurClass}`}>
                                    <VideoPlayer src={srcUrl} provider="html5" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}