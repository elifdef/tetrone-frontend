import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditPost } from "../post/hooks/useEditPost";
import Editor from '../editor/Editor';
import Button from "../ui/Button";
import AttachBar from '../post/components/AttachBar';
import MediaPreviews from '../post/components/MediaPreviews';
import YouTubePreviews from '../post/components/YouTubePreviews';
import { PollIcon, SettingsIcon, EditIcon, SearchIcon } from '../ui/Icons';
import PostService from '../../services/post.service';
import StickerService from '../../services/sticker.service';
import { notifySuccess, notifyError } from '../common/Notify';
import GlobalModal from './GlobalModal';

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
            notifyError(t('api.error.ERR_NETWORK'));
        } finally {
            setIsSavingSettings(false);
        }
    };

    return (
        <GlobalModal isOpen={isOpen} onClose={onClose} onResolve={onClose} type="custom">
            <div
                className={`tetrone-modal-dialog tetrone-edit-modal-wide ${isDragging ? 'drag-active' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="tetrone-modal-header">
                    <h3>{t('action.edit_post')}</h3>
                    <button className="tetrone-modal-close" onClick={onClose}>✖</button>
                </div>

                <div className="tetrone-modal-body tetrone-edit-modal-body">
                    {/* РІДНІ ТАБИ */}
                    <div className="tetrone-tabs tetrone-edit-tabs">
                        <button
                            className={`tetrone-tab ${activeTab === 'content' ? 'active' : ''}`}
                            onClick={() => setActiveTab('content')}
                        >
                            <EditIcon width={14} height={14} className="tetrone-tab-icon" />
                            {t('action.edit')}
                        </button>
                        <button
                            className={`tetrone-tab ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <SettingsIcon width={14} height={14} className="tetrone-tab-icon" />
                            {t('common.settings')}
                        </button>
                    </div>

                    <div className="tetrone-edit-tab-content">
                        {activeTab === 'content' && (
                            <>
                                <Editor className="tetrone-form-textarea fixed-size" value={editContent} onChange={setEditContent} />

                                {post?.entities?.poll && (
                                    <div className="tetrone-attached-poll-preview disabled tetrone-mt-15">
                                        <span className="tetrone-poll-preview-title">
                                            <PollIcon width={16} height={16} className="tetrone-poll-icon-inline" /> {post.entities.poll.question}
                                        </span>
                                        <span className="tetrone-poll-locked-text">{t('poll.edit_locked')}</span>
                                    </div>
                                )}

                                <MediaPreviews previews={existingMedia} onRemove={removeExistingMedia} isExisting={true} />
                                <MediaPreviews previews={newPreviews} onRemove={removeNewFile} />
                                <YouTubePreviews youtubeLinks={external.youtube} removedPreviews={removedPreviews} onToggle={toggleYouTubePreview} />
                            </>
                        )}

                        {activeTab === 'settings' && (
                            <div className="tetrone-edit-settings-tab">
                                <div className="tetrone-form-group">
                                    <label className="tetrone-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={reactionsDisabled}
                                            onChange={(e) => setReactionsDisabled(e.target.checked)}
                                        />
                                        <span className="tetrone-checkbox-text">{t('post.disable_reactions')}</span>
                                    </label>
                                </div>

                                {!reactionsDisabled && (
                                    <>
                                        <div className="tetrone-form-group tetrone-mt-20">
                                            <label>{t('post.max_unique_stickers')}</label>
                                            <input
                                                type="number"
                                                className="tetrone-form-input tetrone-w-50"
                                                min="1" max="50"
                                                value={maxLimit}
                                                onChange={(e) => setMaxLimit(e.target.value)}
                                            />
                                            <div className="tetrone-form-hint">{t('post.max_unique_stickers_hint')}</div>
                                        </div>

                                        <div className="tetrone-form-group tetrone-mt-20">
                                            <label>{t('post.pack_selection_title')}</label>

                                            <div className="tetrone-pack-legend">
                                                <span className="tetrone-legend-item neutral">{t('post.pack_neutral')}</span>
                                                <span className="tetrone-legend-item allowed">{t('post.pack_allowed')}</span>
                                                <span className="tetrone-legend-item blocked">{t('post.pack_blocked')}</span>
                                            </div>

                                            <div className="tetrone-search-input-wrapper tetrone-mb-15">
                                                <SearchIcon className="tetrone-search-icon" width={16} height={16} />
                                                <input
                                                    type="text"
                                                    className="tetrone-form-input"
                                                    placeholder={t('post.search_packs')}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            {isLoadingPacks ? (
                                                <div className="tetrone-empty-state">{t('common.loading')}</div>
                                            ) : (
                                                <div className="tetrone-pack-picker-grid">
                                                    {globalPacks.map(pack => {
                                                        const isAllowed = allowedPacks.includes(pack.id);
                                                        const isBlocked = blockedPacks.includes(pack.id);

                                                        let statusClass = 'neutral';
                                                        if (isAllowed) statusClass = 'allowed';
                                                        if (isBlocked) statusClass = 'blocked';

                                                        return (
                                                            <button
                                                                key={pack.id}
                                                                type="button"
                                                                className={`tetrone-pack-item ${statusClass}`}
                                                                onClick={() => togglePackState(pack.id)}
                                                                title={pack.title}
                                                            >
                                                                <img src={pack.cover_url} alt={pack.title} />
                                                                {isAllowed && <div className="tetrone-pack-status-icon">✓</div>}
                                                                {isBlocked && <div className="tetrone-pack-status-icon">✕</div>}
                                                            </button>
                                                        );
                                                    })}
                                                    {globalPacks.length === 0 && (
                                                        <div className="tetrone-empty-state tetrone-col-span-full">
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
                </div>

                <div className="tetrone-modal-footer tetrone-flex tetrone-justify-between">
                    {activeTab === 'content' ? (
                        <>
                            <AttachBar onFileSelect={handleFileSelect} />
                            <div className="tetrone-flex tetrone-gap-8">
                                <Button variant="secondary" onClick={onClose}>{t('action.cancel')}</Button>
                                <Button onClick={handleSave}>{t('action.save')}</Button>
                            </div>
                        </>
                    ) : (
                        <div className="tetrone-flex tetrone-gap-8 tetrone-w-full tetrone-justify-end">
                            <Button variant="secondary" onClick={onClose}>{t('action.cancel')}</Button>
                            <Button onClick={saveSettings} disabled={isSavingSettings}>{t('action.save')}</Button>
                        </div>
                    )}
                </div>
            </div>
        </GlobalModal>
    );
}