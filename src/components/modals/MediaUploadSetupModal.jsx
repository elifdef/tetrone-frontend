import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Button from '../ui/Button';
import FileTypeIcon from '../ui/FileTypeIcon';
import { formatFileSize } from '../../utils/upload';

export default function MediaUploadSetupModal({ items = [], onApply, onClose }) {
    const { t } = useTranslation();
    const [drafts, setDrafts] = useState({});
    const fileInputsRef = useRef({});

    useEffect(() => {
        if (!items || items.length === 0) {
            setDrafts({});
            return;
        }

        const initial = {};
        items.forEach((item) => {
            initial[item.index] = {
                title: item.defaultTitle || '',
                defaultTitle: item.defaultTitle || '',
                coverFile: null,
                coverPreviewUrl: '',
            };
        });
        setDrafts(initial);
    }, [items]);

    useEffect(() => {
        return () => {
            Object.values(drafts).forEach((d) => {
                if (d?.coverPreviewUrl && d.coverPreviewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(d.coverPreviewUrl);
                }
            });
        };
    }, [drafts]);

    if (!items || items.length === 0) return null;

    const handleTitleChange = (index, value) => {
        setDrafts((prev) => ({
            ...prev,
            [index]: {
                ...prev[index],
                title: value,
            },
        }));
    };

    const handleResetTitle = (index) => {
        setDrafts((prev) => ({
            ...prev,
            [index]: {
                ...prev[index],
                title: prev[index]?.defaultTitle || '',
            },
        }));
    };

    const handleCoverSelect = (index, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setDrafts((prev) => {
            const current = prev[index] || {};
            if (current.coverPreviewUrl && current.coverPreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(current.coverPreviewUrl);
            }
            return {
                ...prev,
                [index]: {
                    ...current,
                    coverFile: file,
                    coverPreviewUrl: URL.createObjectURL(file),
                },
            };
        });
        e.target.value = '';
    };

    const handleRemoveCover = (index) => {
        setDrafts((prev) => {
            const current = prev[index] || {};
            if (current.coverPreviewUrl && current.coverPreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(current.coverPreviewUrl);
            }
            return {
                ...prev,
                [index]: {
                    ...current,
                    coverFile: null,
                    coverPreviewUrl: '',
                },
            };
        });
    };

    const handleKeepDefaults = () => {
        const updates = {};
        items.forEach((item) => {
            const d = drafts[item.index];
            updates[item.index] = {
                custom_title: '',
                custom_cover: d?.coverFile || null,
            };
        });
        onApply(updates);
    };

    const handleConfirm = (e) => {
        if (e) e.preventDefault();
        const updates = {};
        items.forEach((item) => {
            const d = drafts[item.index] || {};
            const trimmed = (d.title || '').trim();
            const isChanged = trimmed !== '' && trimmed !== (d.defaultTitle || '').trim();
            updates[item.index] = {
                custom_title: isChanged ? trimmed : '',
                custom_cover: d.coverFile || null,
            };
        });
        onApply(updates);
    };

    return (
        <Modal
            isOpen={items.length > 0}
            onClose={onClose}
            title={t('post.media_setup_title')}
            sizeClass="modal-md"
            footer={
                <div className="flex justify-end items-center gap-[8px] w-full border-t border-border pt-[10px]">
                    <Button type="button" variant="secondary" onClick={handleKeepDefaults}>
                        {t('post.media_use_default')}
                    </Button>
                    <Button type="button" onClick={handleConfirm}>
                        {t('action.save')}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleConfirm} className="flex flex-col gap-[12px] text-[11px] text-text-main font-tahoma">
                <div className="text-text-muted leading-snug">
                    {t('post.media_setup_desc')}
                </div>

                {items.map((item) => {
                    const draft = drafts[item.index] || {};
                    const isVideo = item.category === 'video';

                    return (
                        <div key={item.index} className="border border-border bg-bg-page p-[10px] flex flex-col gap-[8px]">
                            <div className="flex items-center gap-[8px] min-w-0">
                                <FileTypeIcon fileName={item.originalName} size={22} />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-bold text-text-main truncate" title={item.originalName}>
                                        {item.originalName}
                                    </span>
                                    <span className="text-[9px] text-text-muted uppercase">
                                        {isVideo ? t('common.video') : t('common.audio')}
                                        {item.size > 0 ? ` • ${formatFileSize(item.size)}` : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold text-theme-link">
                                        {t('post.media_custom_name_label')}
                                    </label>
                                    {draft.title !== draft.defaultTitle && (
                                        <button
                                            type="button"
                                            onClick={() => handleResetTitle(item.index)}
                                            className="bg-transparent border-0 p-0 text-[10px] text-text-muted hover:text-theme-link cursor-pointer underline"
                                        >
                                            {t('post.media_reset_default')}
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={draft.title ?? ''}
                                    onChange={(e) => handleTitleChange(item.index, e.target.value)}
                                    placeholder={draft.defaultTitle || t('post.media_custom_name_placeholder')}
                                    className="w-full bg-input-bg border border-input-border text-text-main text-[11px] px-[8px] py-[6px] focus:outline-none focus:border-theme-link"
                                    autoFocus={items.length === 1}
                                />
                            </div>

                            {isVideo && (
                                <div className="flex flex-col gap-[6px] pt-[6px] border-t border-dashed border-border">
                                    <span className="font-bold text-theme-link">
                                        {t('post.video_cover_label')}
                                    </span>

                                    <div className="flex items-center gap-[10px]">
                                        <div className="w-[128px] h-[72px] shrink-0 bg-black border border-border flex items-center justify-center overflow-hidden">
                                            {draft.coverPreviewUrl ? (
                                                <img
                                                    src={draft.coverPreviewUrl}
                                                    alt="preview"
                                                    className="w-full h-full object-cover block"
                                                />
                                            ) : (
                                                <span className="text-[9px] text-white/60 text-center px-[6px]">
                                                    {t('post.video_cover_auto')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-[6px]">
                                            <input
                                                ref={(el) => { fileInputsRef.current[item.index] = el; }}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleCoverSelect(item.index, e)}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputsRef.current[item.index]?.click()}
                                                className="px-[8px] py-[4px] bg-bg-box border border-border text-text-main hover:border-theme-link cursor-pointer text-[11px] text-left"
                                            >
                                                {draft.coverPreviewUrl
                                                    ? t('post.video_cover_change')
                                                    : t('post.video_cover_select')}
                                            </button>

                                            {draft.coverPreviewUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCover(item.index)}
                                                    className="px-[8px] py-[4px] bg-transparent border border-border text-theme-error hover:bg-theme-error/10 cursor-pointer text-[10px] text-left"
                                                >
                                                    {t('post.video_cover_remove')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </form>
        </Modal>
    );
}