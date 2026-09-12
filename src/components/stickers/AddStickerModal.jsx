import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import Modal from '../modals/Modal.jsx';
import Button from '../ui/Button.jsx';
import StickerService from '../../services/sticker.service';
import { notifyError, notifySuccess } from '../common/Notify';

const stickerSchema = z.object({
    shortcode: z.string().min(1, 'errors.required').regex(/^[a-z0-9_]+$/, 'errors.invalid_shortcode'),
    keywords: z.string().optional(),
    file: z.any().refine(val => val !== null, 'errors.required')
});

export default function AddStickerModal({ isOpen, onClose, packId, onRefresh }) {
    const { t } = useTranslation();
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(stickerSchema),
        defaultValues: { shortcode: '', keywords: '', file: null }
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const formData = new FormData();
            formData.append('shortcode', data.shortcode);
            formData.append('file', data.file);
            if (data.keywords) formData.append('keywords', data.keywords);

            return await StickerService.addSticker(packId, formData);
        },
        onSuccess: () => {
            notifySuccess(t('stickers.sticker_added'));
            if (onRefresh) onRefresh();
            onClose();
        },
        onError: (error) => {
            notifyError(error.message || t('common.error'));
        }
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setValue('file', file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                {t('action.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit(mutation.mutate)} disabled={mutation.isPending}>
                {mutation.isPending ? t('common.loading') : t('action.upload')}
            </Button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('stickers.add_sticker')} footer={footer} sizeClass="modal-sm">
            <form className="flex flex-col gap-[10px]" onSubmit={handleSubmit(mutation.mutate)}>

                <div className="flex flex-col items-center mb-[10px]">
                    <div
                        className="w-[100px] h-[100px] border border-dashed border-border bg-bg-page hover:bg-nav-hover cursor-pointer p-[2px] flex items-center justify-center rounded-[3px]"
                        onClick={() => fileInputRef.current.click()}
                    >
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-[24px] text-text-muted leading-none font-bold">+</div>
                        )}
                    </div>
                    {errors.file && <span className="text-theme-error text-[10px] mt-[4px]">{t(errors.file.message)}</span>}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                </div>

                <label className="text-[11px] font-bold text-text-main">{t('stickers.code_to_type')}</label>
                <div className="relative">
                    <span className="absolute left-[6px] top-[5px] text-text-muted">:</span>
                    <input
                        type="text"
                        {...register('shortcode')}
                        placeholder="pepe_sad"
                        className="border border-input-border bg-input-bg pl-[14px] pr-[6px] py-[4px] text-[11px] text-text-main w-full focus:outline-none focus:border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                    />
                    <span className="absolute right-[6px] top-[5px] text-text-muted">:</span>
                </div>
                {errors.shortcode && <span className="text-theme-error text-[10px]">{t(errors.shortcode.message)}</span>}

                <label className="text-[11px] font-bold text-text-main mt-[5px]">{t('stickers.tags')} ({t('common.optional')})</label>
                <input
                    type="text"
                    {...register('keywords')}
                    placeholder="sad, frog, cry"
                    className="border border-input-border bg-input-bg px-[6px] py-[4px] text-[11px] text-text-main w-full focus:outline-none focus:border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                />
            </form>
        </Modal>
    );
}