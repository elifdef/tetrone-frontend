import React, { useState, useRef, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { notifyError } from '../common/Notify.jsx';
import PostItem from '../post/PostItem.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../modals/Modal.jsx';

export default function StickerEditorModal({ stickerToEdit = null, onClose, onSuccess, onDelete }) {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { openConfirm } = useModal();

    const isEditMode = !!stickerToEdit;

    const [file, setFile] = useState(stickerToEdit?.file || null);
    const [preview, setPreview] = useState(stickerToEdit?.url || null);
    const [shortcode, setShortcode] = useState(stickerToEdit?.shortcode || '');
    const [keywords, setKeywords] = useState(stickerToEdit?.keywords || '');

    const fileInputRef = useRef(null);

    const tagsArray = keywords.split(',').filter(k => k.trim() !== '');
    const isKeywordsValid = tagsArray.length <= 5;
    const isShortcodeValid = shortcode.trim().length >= 2 && shortcode.trim().length <= 30 && /^[a-zA-Z0-9_]+$/.test(shortcode.trim());
    const isFormValid = preview !== null && isShortcodeValid && isKeywordsValid;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));

            if (!shortcode && !isEditMode) {
                const defaultName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, '');
                setShortcode(defaultName || 'sticker');
                if (defaultName) setKeywords(defaultName);
            }
        }
    };

    const handleSave = () => {
        if (!isFormValid) return notifyError(t('common.error'));

        onSuccess({
            ...stickerToEdit,
            id: stickerToEdit?.id || Date.now(),
            file: file,
            url: preview,
            shortcode: shortcode.trim(),
            keywords: keywords.trim(),
            isNew: !isEditMode
        });
    };

    const handleDeleteClick = async () => {
        const isConfirmed = await openConfirm(t('action.are_u_sure'), t('action.confirm'));
        if (isConfirmed && onDelete) {
            onDelete(stickerToEdit.id);
        }
    };

    const fakePostSmall = useMemo(() => ({
        id: -1,
        content: {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: t(`easter_eggs.preview_text_${Math.floor(Math.random() * 8 + 1) || 1}`) },
                        { type: 'customSticker', attrs: { id: stickerToEdit?.id, shortcode: shortcode || 'demo_code', src: preview } }
                    ]
                }
            ]
        },
        user: user,
        created_at: new Date().toISOString(),
        likes_count: 0, comments_count: 0, reposts_count: 0,
        is_liked: false, is_repost: false, original_post_id: null
    }), [preview, stickerToEdit?.id, shortcode, user, t]);

    const footerButtons = (
        <div className="flex justify-between w-full items-center">
            <div>
                {isEditMode && (
                    <Button variant="danger" onClick={handleDeleteClick}>
                        {t('action.delete')}
                    </Button>
                )}
            </div>
            <div className="flex gap-[8px]">
                <Button variant="primary" onClick={handleSave} disabled={!isFormValid}>
                    {t('action.save')}
                </Button>
                <Button variant="secondary" onClick={onClose}>
                    {t('action.cancel')}
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={isEditMode ? t('stickers.edit_sticker') : t('stickers.add_sticker')}
            sizeClass="modal-lg"
            footer={footerButtons}
            bodyClassName="bg-bg-page p-[15px]"
        >
            <div className="flex gap-[15px] items-start">
                
                {/* Форма завантаження та інпути */}
                <div className="flex-1 bg-bg-box border border-border p-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    
                    <div className="flex flex-col items-center mb-[15px]">
                        <div
                            className="w-[120px] h-[120px] border border-border bg-nav-hover hover:bg-border cursor-pointer p-[2px] flex items-center justify-center transition-none"
                            onClick={() => fileInputRef.current.click()}
                            title={t('stickers.click_to_upload')}
                        >
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-[32px] text-theme-link opacity-60 leading-none font-bold">+</div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/webp"
                            className="hidden"
                        />
                    </div>

                    <div className="mb-[15px]">
                        <label className="block text-[11px] font-bold text-theme-link mb-[5px]">{t('stickers.code_to_type')}:</label>
                        <div className="flex items-center">
                            <span className="text-text-muted font-bold mr-[4px]">:</span>
                            <input
                                type="text"
                                className={`w-full border bg-input-bg px-[8px] py-[6px] text-[11px] text-text-main outline-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] ${!isShortcodeValid && shortcode.length > 0 ? 'border-theme-error' : 'border-input-border focus:border-theme-link'}`}
                                value={shortcode}
                                onChange={e => setShortcode(e.target.value)}
                                placeholder={t('stickers.placeholder_shortcode')}
                            />
                            <span className="text-text-muted font-bold ml-[4px]">:</span>
                        </div>
                        {!isShortcodeValid && shortcode.length > 0 && (
                            <span className="block text-theme-error text-[10px] mt-[4px]">{t('stickers.err_shortcode_format')}</span>
                        )}
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-theme-link mb-[5px]">{t('stickers.tags')}:</label>
                        <input
                            type="text"
                            className={`w-full border bg-input-bg px-[8px] py-[6px] text-[11px] text-text-main outline-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] ${!isKeywordsValid ? 'border-theme-error' : 'border-input-border focus:border-theme-link'}`}
                            value={keywords}
                            onChange={e => setKeywords(e.target.value)}
                            placeholder={t('stickers.placeholder_tags')}
                        />
                        {!isKeywordsValid && (
                            <span className="block text-theme-error text-[10px] mt-[4px]">{t('stickers.err_tags_format')}</span>
                        )}
                    </div>
                </div>

                {/* Попередній перегляд (Справа) */}
                <div className="w-[300px] flex-shrink-0">
                    <div className="text-[11px] font-bold text-theme-link mb-[8px] pb-[4px] border-b border-border">
                        {t('stickers.preview_label')}
                    </div>
                    {preview ? (
                        <div className="bg-bg-box border border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] pointer-events-none">
                            <PostItem post={fakePostSmall} isOwner={false} currentUserId={user?.id} readonly={true} isInner={true} />
                        </div>
                    ) : (
                        <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px] italic">
                            {t('stickers.err_no_file')}
                        </div>
                    )}
                </div>

            </div>
        </Modal>
    );
}