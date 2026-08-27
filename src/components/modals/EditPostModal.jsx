import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditPost } from "../post/hooks/useEditPost";
import SmartEditor from '../editor/SmartEditor';
import Button from "../ui/Button";
import AttachBar from '../post/components/AttachBar';
import MediaPreviews from '../post/components/MediaPreviews';
import YouTubePreviews from '../post/components/YouTubePreviews';
import {PollIcon, SettingsIcon, EditIcon, SearchIcon} from '../ui/Icons';
import PostService from '../../services/post.service';
import StickerService from '../../services/sticker.service';
import { notifySuccess, notifyError } from '../common/Notify';
import Modal from '../modals/Modal';

export default function EditPostModal({ isOpen, onClose, post, onSaveSuccess }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('content');

    const [maxLimit, setMaxLimit] = useState(8);
    const [reactionsDisabled, setReactionsDisabled] = useState(false);
    const [allowedPacks, setAllowedPacks] = useState([]);
    const [blockedPacks, setBlockedPacks] = useState([]);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [globalPacks, setGlobalPacks] = useState([]);
    const [isLoadingPacks, setIsLoadingPacks] = useState(false);

    const {
        editContent, setEditContent,
        existingMedia, removeExistingMedia,
        removedPreviews, toggleYouTubePreview,
        external, handleSave,
        previews: newPreviews, isDragging,
        handleDragOver, handleDragLeave, handleDrop,
        handleFileSelect, handlePaste, removeFile: removeNewFile
    } = useEditPost(post, async (postId, editData) => {
        if (onSaveSuccess) await onSaveSuccess(postId, editData);
        onClose();
    });

    useEffect(() => {
        if (isOpen && post) {
            setActiveTab('content');
            if (post.reaction_config) {
                setMaxLimit(post.reaction_config.max_limit || 8);
                setReactionsDisabled(post.reaction_config.max_limit === 0);
                setAllowedPacks(post.reaction_config.allowed_packs || []);
                setBlockedPacks(post.reaction_config.blocked_packs || []);
            } else {
                setMaxLimit(8);
                setReactionsDisabled(false);
                setAllowedPacks([]);
                setBlockedPacks([]);
            }
        }
    }, [isOpen, post]);

    useEffect(() => {
        if (activeTab !== 'settings') return;

        const delayDebounceFn = setTimeout(() => {
            setIsLoadingPacks(true);
            StickerService.searchGlobalPacks(searchQuery)
            .then(res => setGlobalPacks(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setIsLoadingPacks(false));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, activeTab]);

    if (!isOpen || !post) return null;

    const togglePackState = (packId) => {
        if (allowedPacks.includes(packId)) {
            setAllowedPacks(prev => prev.filter(id => id !== packId));
            setBlockedPacks(prev => [...prev, packId]);
        } else if (blockedPacks.includes(packId)) {
            setBlockedPacks(prev => prev.filter(id => id !== packId));
        } else {
            setAllowedPacks(prev => [...prev, packId]);
        }
    };

    const saveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const parsedLimit = Number(maxLimit);
            const limitToSave = reactionsDisabled ? 0 : (isNaN(parsedLimit) || parsedLimit < 1 ? 1 : parsedLimit);

            const res = await PostService.updateReactionConfig(post.id, {
                max_limit: limitToSave,
                allowed_packs: allowedPacks,
                blocked_packs: blockedPacks
            });

            if (res.success) {
                notifySuccess(t('post.settings_saved'));
                if (onSaveSuccess) onSaveSuccess();
                onClose();
            } else {
                notifyError(res.message);
            }
        } catch (error) {
            notifyError(t('api.errors.ERR_NETWORK'));
        } finally {
            setIsSavingSettings(false);
        }
    };

    // ФІКС: Нижні панелі переписані на Tailwind
    const footerButtons = activeTab === 'content' ? (
        <div className="flex justify-between items-center w-full border-t border-border pt-[10px] mt-[10px]">
            <AttachBar onFileSelect={handleFileSelect} />
            <div className="flex gap-[10px]">
                <Button variant="secondary" onClick={onClose}>{t('action.cancel')}</Button>
                <Button onClick={handleSave}>{t('action.save')}</Button>
            </div>
        </div>
    ) : (
        <div className="flex justify-end gap-[10px] w-full border-t border-border pt-[10px] mt-[10px]">
            <Button variant="secondary" onClick={onClose}>{t('action.cancel')}</Button>
            <Button onClick={saveSettings} disabled={isSavingSettings}>{t('action.save')}</Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('action.edit_post')}
            dialogClassName={isDragging ? 'bg-input-bg' : ''}
            footer={footerButtons}
            sizeClass="modal-lg"
        >
            <div className="flex border-b border-border mb-[15px]">
                <button
                    type="button"
                    className={`bg-transparent border-none py-[6px] px-[12px] text-[11px] font-bold cursor-pointer flex items-center gap-[6px] outline-none transition-colors border-b-[2px] ${activeTab === 'content' ? 'border-theme-link text-theme-link' : 'border-transparent text-text-muted hover:text-theme-link'}`}
                    onClick={() => setActiveTab('content')}
                >
                    <EditIcon width={14} height={14} />
                    {t('action.edit')}
                </button>
                <button
                    type="button"
                    className={`bg-transparent border-none py-[6px] px-[12px] text-[11px] font-bold cursor-pointer flex items-center gap-[6px] outline-none transition-colors border-b-[2px] ${activeTab === 'settings' ? 'border-theme-link text-theme-link' : 'border-transparent text-text-muted hover:text-theme-link'}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <SettingsIcon width={14} height={14} />
                    {t('common.settings')}
                </button>
            </div>

            <div>
                {activeTab === 'content' && (
                    <>
                        <div className="border border-input-border bg-input-bg rounded-[2px]">
                            {/* ФІКС: Використовуємо SmartEditor з preset="post" */}
                            <SmartEditor
                                preset="post"
                                value={editContent}
                                onChange={setEditContent}
                            />
                        </div>

                        {post?.entities?.poll && (
                            <div className="bg-bg-page border border-border p-[8px_12px] mt-[10px] flex items-center justify-between text-[12px] text-text-muted opacity-70 rounded-[2px] cursor-not-allowed">
                                <span className="flex items-center gap-[6px] font-bold">
                                    <PollIcon width={16} height={16} /> {post.entities.poll.question}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-theme-error">
                                    {t('poll.edit_locked')}
                                </span>
                            </div>
                        )}

                        <MediaPreviews previews={existingMedia} onRemove={removeExistingMedia} isExisting={true} />
                        <MediaPreviews previews={newPreviews} onRemove={removeNewFile} />
                        <YouTubePreviews youtubeLinks={external.youtube} removedPreviews={removedPreviews} onToggle={toggleYouTubePreview} />
                    </>
                )}

                {activeTab === 'settings' && (
                    <div className="flex flex-col gap-[15px]">
                        <div className="flex items-center">
                            <label className="flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={reactionsDisabled}
                                    onChange={(e) => setReactionsDisabled(e.target.checked)}
                                    className="m-0 mr-[8px] w-[14px] h-[14px] accent-theme-link cursor-pointer border-border"
                                />
                                <span className="text-[11px] text-text-main font-bold">{t('post.disable_reactions')}</span>
                            </label>
                        </div>

                        {!reactionsDisabled && (
                            <>
                                <div className="flex flex-col">
                                    <label className="text-[11px] font-bold text-theme-link mb-[4px]">{t('post.max_unique_stickers')}</label>
                                    <input
                                        type="number"
                                        className="w-[100px] bg-input-bg border border-input-border text-text-main text-[11px] p-[6px] rounded-[2px] focus:outline-none focus:border-theme-link"
                                        min="1" max="50"
                                        value={maxLimit}
                                        onChange={(e) => setMaxLimit(e.target.value)}
                                    />
                                    <div className="text-[10px] text-text-muted mt-[4px]">{t('post.max_unique_stickers_hint')}</div>
                                </div>

                                <div className="flex flex-col border-t border-border pt-[15px]">
                                    <label className="text-[11px] font-bold text-theme-link mb-[8px]">{t('post.pack_selection_title')}</label>

                                    <div className="flex gap-[15px] mb-[10px]">
                                        <span className="text-[10px] font-bold flex items-center gap-[4px] text-text-muted">
                                            <span className="w-[8px] h-[8px] rounded-full bg-border"></span> {t('post.pack_neutral')}
                                        </span>
                                        <span className="text-[10px] font-bold flex items-center gap-[4px] text-theme-success">
                                            <span className="w-[8px] h-[8px] rounded-full bg-theme-success"></span> {t('post.pack_allowed')}
                                        </span>
                                        <span className="text-[10px] font-bold flex items-center gap-[4px] text-theme-error">
                                            <span className="w-[8px] h-[8px] rounded-full bg-theme-error"></span> {t('post.pack_blocked')}
                                        </span>
                                    </div>

                                    <div className="relative flex items-center mb-[10px]">
                                        <SearchIcon className="absolute left-[8px] text-text-muted" width={14} height={14} />
                                        <input
                                            type="text"
                                            placeholder={t('post.search_packs')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-input-bg border border-input-border text-text-main text-[11px] py-[6px] pr-[8px] pl-[28px] rounded-[2px] focus:outline-none focus:border-theme-link"
                                        />
                                    </div>

                                    {isLoadingPacks ? (
                                        <div className="text-[11px] text-text-muted italic text-center p-[20px]">{t('common.loading')}</div>
                                    ) : (
                                        <div className="grid grid-cols-5 gap-[8px] max-h-[200px] overflow-y-auto p-[4px]">
                                            {globalPacks.map(pack => {
                                                const isAllowed = allowedPacks.includes(pack.id);
                                                const isBlocked = blockedPacks.includes(pack.id);

                                                let btnClass = "relative border border-border bg-bg-page hover:border-theme-link cursor-pointer p-[4px] rounded-[2px] transition-colors outline-none flex items-center justify-center";
                                                if (isAllowed) btnClass = "relative border border-theme-success bg-[rgba(75,179,75,0.1)] cursor-pointer p-[4px] rounded-[2px] transition-colors outline-none flex items-center justify-center";
                                                if (isBlocked) btnClass = "relative border border-theme-error bg-[rgba(255,51,71,0.1)] cursor-pointer p-[4px] rounded-[2px] transition-colors outline-none flex items-center justify-center";

                                                return (
                                                    <button
                                                        key={pack.id}
                                                        type="button"
                                                        className={btnClass}
                                                        onClick={() => togglePackState(pack.id)}
                                                        title={pack.title}
                                                    >
                                                        <img src={pack.cover_url} alt={pack.title} className="w-full h-auto object-contain" />
                                                        {isAllowed && <div className="absolute top-[-6px] right-[-6px] w-[14px] h-[14px] rounded-full bg-theme-success flex items-center justify-center text-[8px] font-bold text-white shadow-sm">✓</div>}
                                                        {isBlocked && <div className="absolute top-[-6px] right-[-6px] w-[14px] h-[14px] rounded-full bg-theme-error flex items-center justify-center text-[8px] font-bold text-white shadow-sm">✖</div>}
                                                    </button>
                                                );
                                            })}
                                            {globalPacks.length === 0 && (
                                                <div className="col-span-5 text-[11px] text-text-muted italic text-center p-[20px]">
                                                    {t('common.no_results')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}