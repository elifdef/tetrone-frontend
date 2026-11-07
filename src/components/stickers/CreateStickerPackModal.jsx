import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import Modal from '../modals/Modal.jsx';
import Button from '../ui/Button.jsx';
import StickerService from '../../services/sticker.service';
import { notifyError, notifySuccess } from '../common/Notify';
import StickerPackGrid from '../stickers/StickerPackGrid.jsx';
import StickerEditorModal from './StickerEditorModal.jsx';
import { useModal } from '../../context/ModalContext.jsx';

const packSchema = z.object({
    title: z.string().min(1, 'errors.required').max(50, 'errors.max_length'),
    is_published: z.boolean().default(false),
    cover: z.any().optional()
});

export default function CreateStickerPackModal({ isOpen, onClose, existingPack, onSuccess, onRefresh }) {
    const { t } = useTranslation();
    const { openConfirm } = useModal();
    const [coverPreview, setCoverPreview] = useState(null);
    const [editingSticker, setEditingSticker] = useState(null);
    const [isStickerEditorOpen, setIsStickerEditorOpen] = useState(false);
    const fileInputRef = useRef(null);

    const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm({
        resolver: zodResolver(packSchema),
        defaultValues: {
            title: '',
            is_published: false,
            cover: null
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (existingPack) {
                setValue('title', existingPack.title);
                setValue('is_published', existingPack.is_published);
                setCoverPreview(existingPack.cover_url);
            } else {
                reset();
                setCoverPreview(null);
            }
        }
    }, [isOpen, existingPack, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (existingPack) {
                return await StickerService.updatePack(existingPack.short_name, data);
            } else {
                return await StickerService.createPack(data);
            }
        },
        onSuccess: () => {
            notifySuccess(t(existingPack ? 'stickers.pack_updated' : 'stickers.pack_created'));
            if (onSuccess) onSuccess();
            if (onRefresh) onRefresh();
            onClose();
        },
        onError: (error) => {
            notifyError(error.message || t('common.error'));
        }
    });

    const stickerMutation = useMutation({
        mutationFn: async (stickerData) => {
            if (stickerData.isNew) {
                return await StickerService.addSticker(existingPack.short_name, stickerData);
            } else {
                return await StickerService.updateSticker(stickerData.id, stickerData);
            }
        },
        onSuccess: () => {
            notifySuccess(t('stickers.sticker_added'));
            if (onRefresh) onRefresh();
            setIsStickerEditorOpen(false);
            setEditingSticker(null);
        },
        onError: (error) => notifyError(error.message)
    });

    const deleteStickerMutation = useMutation({
        mutationFn: async (stickerId) => await StickerService.deleteSticker(stickerId),
        onSuccess: () => {
            notifySuccess(t('stickers.sticker_deleted'));
            if (onRefresh) onRefresh();
        },
        onError: (error) => notifyError(error.message)
    });

    const deletePackMutation = useMutation({
        mutationFn: async () => await StickerService.deletePack(existingPack.short_name),
        onSuccess: () => {
            notifySuccess(t('stickers.pack_deleted'));
            if (onRefresh) onRefresh();
            onClose();
        },
        onError: (error) => notifyError(error.message)
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setValue('cover', file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleAddStickerClick = () => {
        setEditingSticker(null);
        setIsStickerEditorOpen(true);
    };

    const handleDeletePack = async () => {
        const isConfirmed = await openConfirm(t('stickers.confirm_delete_pack'), t('stickers.delete_pack'));
        if (isConfirmed) {
            deletePackMutation.mutate();
        }
    };

    const footer = (
        <div className="flex justify-between w-full items-center">
            <div>
                {existingPack && (
                    <Button variant="danger" onClick={handleDeletePack} disabled={deletePackMutation.isPending}>
                        {deletePackMutation.isPending ? t('common.loading') : t('stickers.delete_pack')}
                    </Button>
                )}
            </div>
            <div className="flex gap-[8px]">
                <Button variant="primary" onClick={handleSubmit(mutation.mutate)} disabled={mutation.isPending}>
                    {mutation.isPending ? t('common.loading') : t('action.save')}
                </Button>
                <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                    {t('action.cancel')}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={existingPack ? t('stickers.edit_pack') : t('action.create')}
                footer={footer}
                sizeClass="modal-lg"
                bodyClassName="bg-bg-page"
            >
                <div className="bg-bg-box border border-border p-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <form className="flex gap-[20px]">
                        <div className="flex-1">
                            <div className="mb-[15px]">
                                <label className="block text-[11px] font-bold text-theme-link mb-[5px]">
                                    {t('stickers.pack_title')}:
                                </label>
                                <input
                                    type="text"
                                    {...register('title')}
                                    className="w-full border border-input-border bg-input-bg px-[8px] py-[6px] text-[11px] text-text-main outline-none focus:border-theme-link shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]"
                                    maxLength={50}
                                />
                                {errors.title && <span className="block text-theme-error text-[10px] mt-[4px]">{t(errors.title.message)}</span>}
                            </div>

                            <div className="mb-[15px]">
                                <label className="flex items-center text-[11px] text-text-main cursor-pointer select-none">
                                    <Controller
                                        name="is_published"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="checkbox"
                                                className="mr-[6px] accent-theme-link"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                        )}
                                    />
                                    {t('stickers.publish_in_catalog')}
                                </label>
                            </div>
                        </div>

                        <div className="w-[120px] flex flex-col items-center border-l border-border pl-[20px]">
                            <div className="text-[11px] font-bold text-theme-link mb-[8px] w-full text-center">
                                {t('stickers.cover')}:
                            </div>
                            <div
                                className="w-[100px] h-[100px] border border-border bg-nav-hover hover:bg-border cursor-pointer p-[2px] flex items-center justify-center transition-none"
                                onClick={() => fileInputRef.current.click()}
                            >
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover border border-border" />
                                ) : (
                                    <div className="text-[32px] text-theme-link opacity-60 leading-none font-bold">+</div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                            />
                        </div>
                    </form>
                </div>

                {existingPack && (
                    <div className="mt-[15px] bg-bg-box border border-border p-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                        <StickerPackGrid
                            stickers={existingPack.stickers || []}
                            onAddClick={handleAddStickerClick}
                            onStickerClick={(sticker) => {
                                setEditingSticker(sticker);
                                setIsStickerEditorOpen(true);
                            }}
                        />
                    </div>
                )}
            </Modal>

            {isStickerEditorOpen && (
                <StickerEditorModal
                    stickerToEdit={editingSticker}
                    onClose={() => setIsStickerEditorOpen(false)}
                    onSuccess={(data) => stickerMutation.mutate(data)}
                    onDelete={(id) => deleteStickerMutation.mutate(id)}
                />
            )}
        </>
    );
}