import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VideoPlayer from '../../ui/VideoPlayer';
import FileTypeIcon from '../../ui/FileTypeIcon';
import { getMediaCategory } from '../../../utils/fileTypes';
import { formatFileSize } from '../../../utils/upload';
import { EyeOffIcon, DotsIcon, EditIcon } from "../../ui/Icons";

export default function MediaPreviews({ previews, onRemove, onToggleFlag, onToggleNSFW, isExisting = false, onEditClick, onUpdateMediaMeta }) {
    const { t } = useTranslation();
    const [contextMenu, setContextMenu] = useState(null);
    const [editingTitleIndex, setEditingTitleIndex] = useState(null);
    const [editingTitleValue, setEditingTitleValue] = useState('');
    const coverInputsRef = useRef({});
    const menuRef = useRef(null);

    const toggleHandler = onToggleFlag || onToggleNSFW;

    const startRename = (index, currentLabel) => {
        setEditingTitleIndex(index);
        setEditingTitleValue(currentLabel || '');
    };

    const commitRename = (index, originalName) => {
        if (onUpdateMediaMeta) {
            const trimmed = editingTitleValue.trim();
            const defaultBase = originalName.replace(/\.[^/.]+$/, '');
            const nextTitle = trimmed && trimmed !== defaultBase && trimmed !== originalName ? trimmed : '';
            onUpdateMediaMeta(index, { custom_title: nextTitle });
        }
        setEditingTitleIndex(null);
    };

    const handleVideoCoverFile = (index, e) => {
        const file = e.target.files?.[0];
        if (file && onUpdateMediaMeta) {
            onUpdateMediaMeta(index, { custom_cover: file });
        }
        e.target.value = '';
    };

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
    const audios = [];
    const others = [];

    previews.forEach((preview, index) => {
        if (!preview) return;
        const nameStr = String(preview.name || preview.original_name || 'File');
        const displayTitle = String(preview.custom_title || nameStr);
        const category = getMediaCategory(preview);
        const isImage = category === 'image';
        const isFileObject = preview instanceof File || preview instanceof Blob;

        const baseUrl = preview.url || (isFileObject ? URL.createObjectURL(preview) : '');
        const srcUrl = baseUrl + (category === 'video' && baseUrl.startsWith('blob:') ? '#t=0.1' : '');
        const posterUrl = preview.custom_cover_url || preview.cover_url || '';
        const isSpoiler = preview.is_spoiler === true;
        const isNsfw = preview.is_nsfw === true;

        const item = { preview, index, nameStr, displayTitle, srcUrl, posterUrl, isImage, isSpoiler, isNsfw };
        if (category === 'video') videos.push(item);
        else if (category === 'audio') audios.push(item);
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
                    <FileTypeIcon fileName={nameStr} size={28} />
                    <span className="text-[11px] font-bold mt-[6px] whitespace-nowrap overflow-hidden text-ellipsis w-full text-text-main" title={nameStr}>{nameStr}</span>
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

            {audios.length > 0 && (
                <div className="flex flex-col gap-[6px] mt-[10px]">
                    {audios.map(({ preview, index, nameStr, displayTitle }) => {
                        const removeId = isExisting ? preview.id : index;
                        const key = isExisting ? `exist-audio-${preview.id}` : `new-audio-${index}`;
                        const fileSize = preview.size || preview.file_size || 0;
                        const isRenaming = !isExisting && editingTitleIndex === index;

                        return (
                            <div key={key} className="flex items-center justify-between gap-[8px] p-[6px_10px] bg-bg-box border border-border">
                                <div className="flex items-center gap-[8px] min-w-0 flex-1">
                                    <FileTypeIcon fileName={nameStr} size={22} />
                                    <div className="flex flex-col min-w-0 flex-1">
                                        {isRenaming ? (
                                            <input
                                                type="text"
                                                value={editingTitleValue}
                                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                                onBlur={() => commitRename(index, nameStr)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        commitRename(index, nameStr);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingTitleIndex(null);
                                                    }
                                                }}
                                                className="w-full bg-input-bg border border-theme-link text-text-main text-[11px] px-[6px] py-[2px] outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-[11px] font-bold text-text-main truncate" title={displayTitle}>
                                                {displayTitle}
                                            </span>
                                        )}
                                        {fileSize > 0 && (
                                            <span className="text-[9px] text-text-muted">
                                                {formatFileSize(fileSize)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-[4px] shrink-0">
                                    {!isExisting && onUpdateMediaMeta && !isRenaming && (
                                        <button
                                            type="button"
                                            className="bg-transparent border-none text-text-muted hover:text-theme-link cursor-pointer p-[3px] flex items-center justify-center outline-none"
                                            onClick={() => startRename(index, preview.custom_title || nameStr.replace(/\.[^/.]+$/, ''))}
                                            title={t('post.media_rename')}
                                        >
                                            <EditIcon width={12} height={12} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="bg-transparent border-none text-text-muted hover:text-theme-error cursor-pointer text-[15px] leading-none px-[4px] outline-none"
                                        onClick={() => onRemove(removeId)}
                                        title={t('action.delete')}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {videos.length > 0 && (
                <div className="flex flex-col gap-[10px] mt-[10px]">
                    {videos.map(({ preview, index, nameStr, displayTitle, srcUrl, posterUrl, isSpoiler, isNsfw }) => {
                        const removeId = isExisting ? preview.id : index;
                        const key = isExisting ? `exist-video-${preview.id}` : `new-video-${index}`;
                        const blurClass = isNsfw ? 'blur-2xl scale-110 pointer-events-none' : (isSpoiler ? 'blur-lg scale-105 pointer-events-none' : '');
                        const isRenaming = !isExisting && editingTitleIndex === index;

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

                                {isNsfw && <div className="absolute bottom-[40px] left-[10px] pointer-events-none bg-theme-error text-white px-[6px] py-[2px] rounded-[2px] z-20 font-bold text-[12px] tracking-wider shadow-sm">{t('post.nsfw_badge')}</div>}
                                {isSpoiler && !isNsfw && <div className="absolute bottom-[40px] left-[10px] pointer-events-none bg-[rgba(0,0,0,0.6)] text-white p-[6px] rounded-[2px] z-20"><EyeOffIcon width={16} height={16} /></div>}

                                <div className={`overflow-hidden w-full transition-all ${blurClass}`}>
                                    <VideoPlayer src={srcUrl} poster={posterUrl} provider="html5" />
                                </div>

                                {!isExisting && onUpdateMediaMeta && (
                                    <div className="flex flex-wrap items-center justify-between gap-[8px] px-[8px] py-[6px] bg-bg-box border-t border-border text-[11px]">
                                        <div className="flex items-center gap-[6px] min-w-0 flex-1">
                                            {isRenaming ? (
                                                <input
                                                    type="text"
                                                    value={editingTitleValue}
                                                    onChange={(e) => setEditingTitleValue(e.target.value)}
                                                    onBlur={() => commitRename(index, nameStr)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            commitRename(index, nameStr);
                                                        } else if (e.key === 'Escape') {
                                                            setEditingTitleIndex(null);
                                                        }
                                                    }}
                                                    className="w-full bg-input-bg border border-theme-link text-text-main text-[11px] px-[6px] py-[2px] outline-none"
                                                    autoFocus
                                                />
                                            ) : (
                                                <>
                                                    <span className="font-bold text-text-main truncate" title={displayTitle}>
                                                        {displayTitle}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => startRename(index, preview.custom_title || nameStr.replace(/\.[^/.]+$/, ''))}
                                                        className="bg-transparent border-none text-text-muted hover:text-theme-link cursor-pointer p-[2px] flex items-center shrink-0 outline-none"
                                                        title={t('post.media_rename')}
                                                    >
                                                        <EditIcon width={12} height={12} />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-[6px] shrink-0">
                                            <input
                                                ref={(el) => { coverInputsRef.current[index] = el; }}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleVideoCoverFile(index, e)}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => coverInputsRef.current[index]?.click()}
                                                className="px-[6px] py-[2px] bg-bg-page border border-border text-theme-link hover:border-theme-link cursor-pointer text-[10px]"
                                            >
                                                {posterUrl ? t('post.video_cover_change') : t('post.video_cover_select')}
                                            </button>
                                            {posterUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdateMediaMeta(index, { custom_cover: null })}
                                                    className="px-[5px] py-[2px] bg-transparent border border-border text-theme-error hover:bg-theme-error/10 cursor-pointer text-[10px]"
                                                    title={t('post.video_cover_remove')}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}