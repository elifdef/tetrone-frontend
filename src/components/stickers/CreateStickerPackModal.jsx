import React, {useState, useRef, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useMutation} from '@tanstack/react-query';
import Modal from '../modals/Modal.jsx';
import Button from '../ui/Button.jsx';
import StickerService from '../../services/sticker.service';
import {notifyError, notifySuccess} from '../common/Notify';
import StickerPackGrid from '../stickers/StickerPackGrid.jsx';
import AddStickerModal from './AddStickerModal.jsx'; // Нова модалка

const packSchema = z.object({
    title:        z.string().min(1, 'errors.required').max(50, 'errors.max_length'),
    is_published: z.boolean().default(false),
    cover:        z.any().optional()
});

export default function CreateStickerPackModal({isOpen, onClose, existingPack, onSuccess, onRefresh})
{
    const {t} = useTranslation();
    const [coverPreview, setCoverPreview] = useState(null);
    const [isAddingSticker, setIsAddingSticker] = useState(false);
    const fileInputRef = useRef(null);

    const {register, handleSubmit, control, setValue, reset, formState: {errors}} = useForm({
        resolver:      zodResolver(packSchema),
        defaultValues: {
            title:        '',
            is_published: false,
            cover:        null
        }
    });

    useEffect(() =>
    {
        if (isOpen)
        {
            if (existingPack)
            {
                setValue('title', existingPack.title);
                setValue('is_published', existingPack.is_published);
                setCoverPreview(existingPack.cover_url);
            } else
            {
                reset();
                setCoverPreview(null);
            }
        }
    }, [isOpen, existingPack, setValue, reset]);

    const mutation = useMutation({
        mutationFn: async (data) =>
                    {
                        const formData = new FormData();
                        formData.append('title', data.title);
                        formData.append('is_published', data.is_published ? '1' : '0');
                        if (data.cover)
                        {
                            formData.append('cover', data.cover);
                        }

                        if (existingPack)
                        {
                            return await StickerService.updatePack(existingPack.id, formData);
                        } else
                        {
                            return await StickerService.createPack(formData);
                        }
                    },
        onSuccess:  () =>
                    {
                        notifySuccess(t(existingPack ? 'stickers.pack_updated' : 'stickers.pack_created'));
                        if (onSuccess) onSuccess();
                        if (onRefresh) onRefresh();
                        onClose();
                    },
        onError:    (error) =>
                    {
                        notifyError(error.message || t('common.error'));
                    }
    });

    // Видалення стікера
    const deleteStickerMutation = useMutation({
        mutationFn: async (stickerId) => await StickerService.deleteSticker(existingPack.id, stickerId),
        onSuccess:  () =>
                    {
                        notifySuccess(t('stickers.sticker_deleted'));
                        if (onRefresh) onRefresh(); // Оновлюємо дані паку
                    },
        onError:    (error) => notifyError(error.message)
    });

    const handleFileChange = (e) =>
    {
        const file = e.target.files[0];
        if (file)
        {
            setValue('cover', file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                {t('action.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit(mutation.mutate)} disabled={mutation.isPending}>
                {mutation.isPending ? t('common.loading') : t('action.save')}
            </Button>
        </>
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={existingPack ? t('stickers.edit_pack') : t('action.create')}
                footer={footer}
                sizeClass="modal-lg" // Робимо ширшим, щоб влізли стікери
            >
                {/* Налаштування самого паку */}
                <form className="flex flex-col sm:flex-row gap-[15px] mb-[15px]">
                    <div className="flex-1 flex flex-col gap-[10px]">
                        <label className="text-[11px] font-bold text-text-main">
                            {t('stickers.pack_title')}
                        </label>
                        <input
                            type="text"
                            {...register('title')}
                            className="border border-input-border bg-input-bg px-[6px] py-[4px] text-[11px] text-text-main w-full focus:outline-none focus:border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                            maxLength={50}
                        />
                        {errors.title && <span className="text-theme-error text-[10px]">{t(errors.title.message)}</span>}

                        <label className="flex items-center text-[11px] text-text-main cursor-pointer mt-[10px]">
                            <Controller
                                name="is_published"
                                control={control}
                                render={({field}) => (
                                    <input
                                        type="checkbox"
                                        className="mr-[6px]"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                )}
                            />
                            {t('stickers.publish_in_catalog')}
                        </label>
                    </div>

                    <div className="w-[120px] flex flex-col items-center">
                        <div className="text-[11px] font-bold text-text-main mb-[5px] text-center w-full">
                            {t('stickers.cover')}
                        </div>
                        <div
                            className="w-[100px] h-[100px] border border-border bg-bg-page hover:bg-nav-hover cursor-pointer p-[2px] flex items-center justify-center rounded-[3px]"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {coverPreview ? (
                                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover"/>
                            ) : (
                                <div className="text-[32px] text-text-muted leading-none font-bold">+</div>
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

                {/* Блок зі стікерами (показується тільки якщо пак вже створено) */}
                {existingPack && (
                    <>
                        <div className="border-t border-border mt-[15px] pt-[15px]">
                            <StickerPackGrid
                                stickers={existingPack.stickers || []}
                                onAddClick={() => setIsAddingSticker(true)}
                                onStickerClick={(sticker) =>
                                {
                                    if (window.confirm(t('stickers.confirm_delete_sticker')))
                                    {
                                        deleteStickerMutation.mutate(sticker.id);
                                    }
                                }}
                            />
                        </div>
                    </>
                )}
            </Modal>

            {/* Модалка для додавання нового стікера */}
            {isAddingSticker && existingPack && (
                <AddStickerModal
                    isOpen={isAddingSticker}
                    packId={existingPack.id}
                    onClose={() => setIsAddingSticker(false)}
                    onRefresh={onRefresh}
                />
            )}
        </>
    );
}