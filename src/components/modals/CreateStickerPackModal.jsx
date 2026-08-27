import React, {useState, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import StickerService from '../../services/sticker.service.js';
import {notifyError, notifySuccess} from '../common/Notify.jsx';
import StickerEditorModal from './StickerEditorModal.jsx';
import {useModal} from '../../context/ModalContext.jsx';
import Button from '../ui/Button.jsx';
import Modal from './Modal.jsx';

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

    const hasChanges = title !== initialState.title || isPublished !== initialState.isPublished || coverFile !== null || stickersChanged || deletedStickerIds.length > 0;

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
                    await StickerService.addSticker(packShortName, {file: sticker.file, shortcode: sticker.shortcode, keywords: sticker.keywords});
                } else if (!sticker.isNew && existingPack)
                {
                    const original = existingPack.stickers.find(s => s.id === sticker.id);
                    if (original && (original.shortcode !== sticker.shortcode || original.keywords !== sticker.keywords || sticker.file))
                    {
                        await StickerService.updateSticker(sticker.id, {file: sticker.file, shortcode: sticker.shortcode, keywords: sticker.keywords});
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
        if (existingPack?.stickers?.find(s => s.id === id)) setDeletedStickerIds(prev => [...prev, id]);
    };

    const footerButtons = (
        <div className="flex justify-between w-full items-center">
            <div>
                {packShortName && <Button variant="danger" onClick={executeDeletePack}>{t('action.delete')}</Button>}
            </div>
            <div className="flex gap-[8px]">
                <Button variant="secondary" onClick={handleCloseAttempt}>{t('action.cancel')}</Button>
                <Button onClick={handleSavePack} disabled={isSaving || !hasChanges}>{isSaving ? t('common.loading') : t('action.save')}</Button>
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
            >
                <div className="flex gap-[20px] bg-[rgba(128,128,128,0.05)] border border-border p-[15px] mb-[20px] max-md:flex-col max-md:items-center">
                    <div className="flex-1 flex flex-col justify-center max-md:w-full">
                        <label className="font-bold text-[11px] mb-[4px]">{t('stickers.pack_title')}</label>
                        <input
                            type="text"
                            className="bg-input-bg border border-input-border text-text-main p-[6px] w-full outline-none focus:border-theme-link"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            maxLength={50}
                        />

                        <label className="flex items-center gap-[6px] cursor-pointer select-none mt-[15px]">
                            <input
                                type="checkbox"
                                className="w-[13px] h-[13px] accent-theme-link m-0"
                                checked={isPublished}
                                onChange={e => setIsPublished(e.target.checked)}
                            />
                            <span className="text-[11px]">{t('stickers.publish_in_catalog')}</span>
                        </label>
                    </div>

                    <div className="w-[120px] shrink-0 flex flex-col items-center">
                        <div className="text-[11px] font-bold text-text-main mb-[5px] text-center">{t('stickers.cover')}</div>
                        <div
                            className="w-[100px] h-[100px] border border-border bg-bg-box flex items-center justify-center cursor-pointer transition-colors hover:border-theme-link overflow-hidden"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {coverPreview ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover"/> : <div className="text-[32px] text-text-muted">+</div>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleCoverChange} accept="image/png, image/jpeg, image/webp" className="hidden"/>
                    </div>
                </div>

                {packShortName && (
                    <div className="border-t border-border pt-[20px]">
                        <div className="text-[11px] font-bold mb-[10px]">
                            {t('stickers.stickers_list')} ({localStickers.length})
                        </div>

                        <div className="grid grid-cols-5 gap-[8px] max-md:grid-cols-4 max-sm:grid-cols-3">
                            <div
                                className="flex flex-col items-center justify-center bg-[rgba(128,128,128,0.05)] border border-dashed border-theme-link cursor-pointer hover:bg-[rgba(128,128,128,0.1)] transition-colors aspect-square"
                                onClick={() => setEditorModal({isOpen: true, sticker: null})}
                            >
                                <div className="text-[24px] text-theme-link mb-[5px]">+</div>
                                <div className="text-[11px] text-theme-link text-center px-[5px]">{t('stickers.add_sticker')}</div>
                            </div>

                            {localStickers.map(sticker => (
                                <div
                                    key={sticker.id}
                                    className="border border-border bg-bg-box cursor-pointer flex items-center justify-center aspect-square p-[4px] hover:border-theme-link transition-colors"
                                    onClick={() => setEditorModal({isOpen: true, sticker: sticker})}
                                    title={`:${sticker.shortcode}:`}
                                >
                                    <img src={sticker.url} alt={sticker.shortcode} className="max-w-full max-h-full object-contain"/>
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