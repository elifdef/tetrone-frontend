import React, {useState, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import StickerService from '../../services/sticker.service.js';
import {notifyError, notifySuccess} from '../common/Notify.jsx';
import StickerEditorModal from './StickerEditorModal.jsx';
import {useModal} from '../../context/ModalContext.jsx';
import Button from '../ui/Button.jsx';
import Modal from './Modal.jsx';
import './CreateStickerPackModal.css';

export default function CreateStickerPackModal({existingPack = null, onSuccess, onCancel, onRefresh})
{
    const {t} = useTranslation();
    const {openConfirm} = useModal();

    const [packShortName, setPackShortName] = useState(existingPack?.short_name || null);
    const [title, setTitle] = useState(existingPack?.title || '');
    const [isPublished, setIsPublished] = useState(existingPack?.is_published || false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(existingPack?.cover_url || null);

    const [localStickers, setLocalStickers] = useState(existingPack?.stickers || []);
    const [deletedStickerIds, setDeletedStickerIds] = useState([]);

    const [initialState, setInitialState] = useState({
        title:       existingPack?.title || '',
        isPublished: existingPack?.is_published || false,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [editorModal, setEditorModal] = useState({isOpen: false, sticker: null});

    const [stickersChanged, setStickersChanged] = useState(false);
    const fileInputRef = useRef(null);

    const hasChanges =
        title !== initialState.title ||
        isPublished !== initialState.isPublished ||
        coverFile !== null ||
        stickersChanged ||
        deletedStickerIds.length > 0;

    const handleCloseAttempt = async () =>
    {
        if (hasChanges)
        {
            const isConfirmed = await openConfirm(t('action.unsaved_changes'), t('action.confirm'));
            if (isConfirmed) onCancel();
        } else
        {
            onCancel();
        }
    };

    const executeDeletePack = async () =>
    {
        const isConfirmed = await openConfirm(t('stickers.confirm_delete_pack'), t('action.confirm'));
        if (!isConfirmed) return;

        try
        {
            await StickerService.deletePack(packShortName);
            notifySuccess(t('stickers.deleted'));
            if (onSuccess) onSuccess();
            if (onRefresh) onRefresh();
        } catch (error)
        {
            notifyError(error.message);
        }
    };

    const handleCoverChange = (e) =>
    {
        const file = e.target.files[0];
        if (file)
        {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSavePack = async () =>
    {
        if (!title.trim()) return notifyError(t('stickers.err_empty_title'));

        setIsSaving(true);
        try
        {
            const packData = {title, is_published: isPublished, cover: coverFile};
            let currentPackShortName = packShortName;

            if (currentPackShortName)
            {
                await StickerService.updatePack(currentPackShortName, packData);
            } else
            {
                if (!coverFile)
                {
                    setIsSaving(false);
                    return notifyError(t('stickers.err_no_cover'));
                }
                const response = await StickerService.createPack(packData);
                currentPackShortName = response.data.short_name;
                setPackShortName(currentPackShortName);
            }

            for (const id of deletedStickerIds)
            {
                if (typeof id !== 'string' && typeof id !== 'number') continue;
                await StickerService.deleteSticker(id);
            }

            for (const sticker of localStickers)
            {
                if (sticker.isNew && sticker.file)
                {
                    await StickerService.addSticker(packShortName, {
                        file:      sticker.file,
                        shortcode: sticker.shortcode,
                        keywords:  sticker.keywords
                    });
                } else if (!sticker.isNew && existingPack)
                {
                    const original = existingPack.stickers.find(s => s.id === sticker.id);
                    const hasStickerChanged = original && (original.shortcode !== sticker.shortcode || original.keywords !== sticker.keywords || sticker.file);

                    if (hasStickerChanged)
                    {
                        await StickerService.updateSticker(sticker.id, {
                            file:      sticker.file,
                            shortcode: sticker.shortcode,
                            keywords:  sticker.keywords
                        });
                    }
                }
            }

            setInitialState({title, isPublished});
            setCoverFile(null);
            setStickersChanged(false);
            setDeletedStickerIds([]);

            notifySuccess(t('action.saved'));
            if (onSuccess) onSuccess();
            if (onRefresh) onRefresh();
        } catch (error)
        {
            notifyError(error.message || t('common.error'));
        } finally
        {
            setIsSaving(false);
        }
    };

    const handleStickerSavedLocal = (stickerData) =>
    {
        setStickersChanged(true);
        setLocalStickers(prev =>
        {
            const exists = prev.find(s => s.id === stickerData.id);
            if (exists) return prev.map(s => s.id === stickerData.id ? stickerData : s);
            return [...prev, stickerData];
        });
    };

    const handleStickerDeleteLocal = (id) =>
    {
        setStickersChanged(true);
        setLocalStickers(prev => prev.filter(s => s.id !== id));
        if (existingPack?.stickers?.find(s => s.id === id))
        {
            setDeletedStickerIds(prev => [...prev, id]);
        }
    };

    const footerButtons = (
        <div className="tetrone-flex-between tetrone-w-full">
            <div>
                {packShortName && (
                    <Button variant="danger" onClick={executeDeletePack}>
                        {t('action.delete')}
                    </Button>
                )}
            </div>
            <div className="tetrone-flex tetrone-gap-8">
                <Button variant="secondary" onClick={handleCloseAttempt}>
                    {t('action.cancel')}
                </Button>
                <Button onClick={handleSavePack} disabled={isSaving || !hasChanges}>
                    {isSaving ? t('common.loading') : t('action.save')}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <Modal
                isOpen={true}
                onClose={handleCloseAttempt}
                title={packShortName ? t('stickers.edit_pack') : t('stickers.create_pack')}
                sizeClass="modal-lg"
                footer={footerButtons}
                bodyClassName="tetrone-pack-manager-body"
            >
                <div className="tetrone-setup-layout">
                    <div className="tetrone-setup-form-col">
                        <label className="tetrone-classic-form-label">{t('stickers.pack_title')}</label>
                        <input
                            type="text"
                            className="tetrone-classic-input tetrone-w-full"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            maxLength={50}
                        />

                        <label className="tetrone-checkbox-label tetrone-mt-15">
                            <input
                                type="checkbox"
                                className="tetrone-checkbox"
                                checked={isPublished}
                                onChange={e => setIsPublished(e.target.checked)}
                            />
                            <span className="tetrone-checkbox-text">{t('stickers.publish_in_catalog')}</span>
                        </label>
                    </div>

                    <div className="tetrone-setup-preview-col">
                        <div className="tetrone-preview-label tetrone-text-center">{t('stickers.cover')}</div>
                        <div
                            className="tetrone-pack-cover-img-preview tetrone-pointer"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {coverPreview ? <img src={coverPreview} alt="Cover"/> : <div className="tetrone-pack-cover-placeholder">+</div>}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleCoverChange}
                            accept="image/png, image/jpeg, image/webp"
                            className="tetrone-hidden"
                        />
                    </div>
                </div>

                {packShortName && (
                    <div className="tetrone-pack-items-manager">
                        <div className="tetrone-preview-label">
                            {t('stickers.stickers_list')} ({localStickers.length})
                        </div>

                        <div className="tetrone-sticker-grid-scroll tetrone-packs-grid">
                            <div
                                className="tetrone-grid-item tetrone-create-pack-card tetrone-pointer"
                                onClick={() => setEditorModal({isOpen: true, sticker: null})}
                            >
                                <div className="tetrone-create-pack-icon">+</div>
                                <div className="tetrone-create-pack-text">{t('stickers.add_sticker')}</div>
                            </div>

                            {localStickers.map(sticker => (
                                <div
                                    key={sticker.id}
                                    className="tetrone-grid-item tetrone-pointer tetrone-sticker-item-preview"
                                    onClick={() => setEditorModal({isOpen: true, sticker: sticker})}
                                    title={`:${sticker.shortcode}:`}
                                >
                                    <img src={sticker.url} alt={sticker.shortcode}/>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>

            {editorModal.isOpen && (
                <StickerEditorModal
                    stickerToEdit={editorModal.sticker}
                    onClose={() => setEditorModal({isOpen: false, sticker: null})}
                    onSuccess={handleStickerSavedLocal}
                    onDelete={handleStickerDeleteLocal}
                />
            )}
        </>
    );
}