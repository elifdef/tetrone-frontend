import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import ImagePreviewModal from '../ui/ImagePreviewModal';
import Modal from '../modals/Modal.jsx';
import SmartEditor from '../editor/SmartEditor';
import RichText from '../common/RichText.jsx';
import { parseRichText, getPlainText } from './utils/messageParser.js';
import { GroupIcon } from '../ui/Icons.jsx';

const PhotoSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

const VideoSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const AudioSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

const DocSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const BrushSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
    </svg>
);

const CloseSmallSvg = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function ChatComposer({
    myself,
    activeChat,
    canSendAsGroup = false,
    sendAsGroup = false,
    setSendAsGroup,
    targetUser,
    targetAvatar,
    activeChatSlug,
    editorResetKey = 0,
    text,
    setText,
    files,
    editingMessage,
    replyingTo,
    replyingToName,
    handleSend,
    handleCancelReplyEdit,
    handleFileChange,
    handleAddGraffitiFile,
    handleRemoveFile,
    onTyping
}) {
    const { t } = useTranslation();
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    const [isGraffitiOpen, setIsGraffitiOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);

    const triggerFileSelect = (accept = '*') => {
        setIsAttachMenuOpen(false);
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        isDrawingRef.current = true;
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#2b587a';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
    };

    const handleSaveGraffiti = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        handleAddGraffitiFile?.(dataUrl);
        setIsGraffitiOpen(false);
    };

    const isImageAttachment = (f) =>
        f.type?.startsWith('image/') || f.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isVideoAttachment = (f) =>
        f.type?.startsWith('video/') || f.name?.match(/\.(mp4|webm|ogg)$/i);

    return (
        <div className="p-[10px_12px] bg-header-bg">
            {(replyingTo || editingMessage) && (
                <div className="flex items-center justify-between px-[10px] py-[5px] mb-[8px] bg-bg-box border border-border text-[11px]">
                    <div className="truncate pr-[10px] flex items-center gap-[6px]">
                        <span className="font-bold text-theme-link shrink-0">
                            {editingMessage
                                ? t('chat.composer.editing_message')
                                : t('chat.composer.replying_to', { name: replyingToName })}:
                        </span>
                        <div className="text-text-muted truncate">
                            {(() => {
                                const targetObj = editingMessage || replyingTo;
                                const contentText = targetObj?.text || targetObj?.reply_to?.text;
                                if (contentText) {
                                    return (
                                        <RichText
                                            text={parseRichText(contentText)}
                                            className="post-text [&_p]:inline [&_p]:m-0"
                                            limit={100000}
                                        />
                                 );
                                }
                                const filesList = targetObj?.files || targetObj?.reply_to?.files || [];
                                if (filesList.length > 0) {
                                    return <span>[{filesList[0].name || 'Attachment'}]</span>;
                                }
                                return <span>[Media]</span>;
                            })()}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCancelReplyEdit}
                        className="text-[11px] text-text-muted hover:text-theme-error bg-transparent border-none cursor-pointer shrink-0 flex items-center"
                    >
                        <CloseSmallSvg />
                    </button>
                </div>
            )}

            {files?.length > 0 && (
                <div className="flex flex-wrap gap-[10px] mb-[8px] p-[8px] bg-bg-box border border-border">
                    {files.map((file, idx) => {
                        const fileSrc = file.previewUrl || file.url;
                        if (isImageAttachment(file)) {
                            return (
                                <div key={idx} className="relative w-[84px] h-[68px] border border-border bg-bg-page group overflow-hidden">
                                    <img
                                        src={fileSrc}
                                        alt={file.name}
                                        onClick={() => setPreviewImageUrl(fileSrc)}
                                        className="w-full h-full object-cover cursor-pointer"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(idx)}
                                        className="absolute top-[2px] right-[2px] w-[18px] h-[18px] bg-[rgba(0,0,0,0.65)] text-white border-none cursor-pointer flex items-center justify-center hover:bg-theme-error"
                                    >
                                        <CloseSmallSvg />
                                    </button>
                                </div>
                            );
                        }

                        if (isVideoAttachment(file)) {
                            return (
                                <div key={idx} className="relative w-[110px] h-[68px] border border-border bg-black overflow-hidden">
                                    <video src={fileSrc} className="w-full h-full object-cover" muted />
                                    <span className="absolute bottom-[3px] left-[4px] text-white bg-[rgba(0,0,0,0.6)] px-[4px] py-[1px] text-[9px] flex items-center gap-[3px]">
                                        <VideoSvg />
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(idx)}
                                        className="absolute top-[2px] right-[2px] w-[18px] h-[18px] bg-[rgba(0,0,0,0.65)] text-white border-none cursor-pointer flex items-center justify-center hover:bg-theme-error"
                                    >
                                        <CloseSmallSvg />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div key={idx} className="relative flex items-center gap-[6px] px-[8px] py-[5px] bg-bg-page border border-border text-[11px]">
                                <DocSvg />
                                <span className="max-w-[140px] truncate">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(idx)}
                                    className="text-text-muted hover:text-theme-error bg-transparent border-none cursor-pointer flex items-center"
                                >
                                    <CloseSmallSvg />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex items-start gap-[10px]">
                {/* Лівий аватар: якщо canSendAsGroup — клік перемикає між собою і бесідою */}
                <div
                    onClick={() => canSendAsGroup && setSendAsGroup?.(prev => !prev)}
                    title={canSendAsGroup ? t('chat.composer.toggle_identity_hint') : ''}
                    className={`relative shrink-0 hidden sm:block ${canSendAsGroup ? 'cursor-pointer group' : ''}`}
                >
                    {sendAsGroup && activeChat?.is_group ? (
                        activeChat.avatar ? (
                            <img
                                src={activeChat.avatar}
                                alt=""
                                className="w-[36px] h-[36px] object-cover border-[2px] border-theme-link block"
                            />
                        ) : (
                            <div className="w-[36px] h-[36px] bg-bg-page border-[2px] border-theme-link flex items-center justify-center text-theme-link">
                                <GroupIcon size={18} />
                            </div>
                        )
                    ) : (
                        <Avatar
                            user={myself}
                            className="w-[36px] h-[36px] object-cover border border-border block"
                        />
                    )}
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {canSendAsGroup && (
                        <div className="flex items-center justify-between mb-[4px] text-[10px] text-text-muted">
                            <span>
                                {sendAsGroup
                                    ? `${t('chat.composer.writing_as_group')}: ${getPlainText(activeChat?.title)}`
                                    : `${t('chat.composer.writing_as_user')}: ${myself?.first_name} (@${myself?.username})`}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSendAsGroup?.(prev => !prev)}
                                className="bg-transparent border-none p-0 text-[10px] text-theme-link hover:underline cursor-pointer"
                            >
                                {t('chat.composer.switch_identity')}
                            </button>
                        </div>
                    )}

                    <div className="w-full bg-bg-box text-text-main border border-border focus-within:border-theme-link">
                        <SmartEditor
                            key={`editor_${activeChatSlug}_${editingMessage?.uuid || 'draft'}_${editorResetKey}`}
                            value={text}
                            onChange={(val) => {
                                setText(val);
                                onTyping?.();
                            }}
                            onEnter={handleSend}
                            placeholder={t('chat.composer.placeholder')}
                            className="min-h-[58px] text-[12px] outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-[8px] mt-[8px]">
                        <Button variant="primary" onClick={handleSend}>
                            {t('chat.composer.send')}
                        </Button>

                        <div className="relative">
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => setIsAttachMenuOpen(prev => !prev)}
                            >
                                {t('chat.composer.add')}
                            </Button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {isAttachMenuOpen && (
                                <div className="absolute right-0 bottom-full mb-[4px] w-[165px] bg-bg-box border border-border shadow-md z-20 flex flex-col divide-y divide-border text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => triggerFileSelect('image/*')}
                                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                    >
                                        <PhotoSvg />
                                        <span>{t('chat.composer.attach.photo')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => triggerFileSelect('video/*')}
                                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                    >
                                        <VideoSvg />
                                        <span>{t('chat.composer.attach.video')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => triggerFileSelect('audio/*')}
                                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                    >
                                        <AudioSvg />
                                        <span>{t('chat.composer.attach.audio')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => triggerFileSelect('*')}
                                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                    >
                                        <DocSvg />
                                        <span>{t('chat.composer.attach.document')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAttachMenuOpen(false);
                                            setIsGraffitiOpen(true);
                                        }}
                                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                    >
                                        <BrushSvg />
                                        <span>{t('chat.composer.attach.graffiti')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {targetAvatar ? (
                    <img
                        src={targetAvatar}
                        alt=""
                        className="w-[36px] h-[36px] object-cover border border-border shrink-0 hidden sm:block"
                    />
                ) : (
                    <Avatar
                        user={targetUser}
                        className="w-[36px] h-[36px] object-cover border border-border shrink-0 hidden sm:block"
                    />
                )}
            </div>

            {isGraffitiOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setIsGraffitiOpen(false)}
                    title={t('chat.composer.attach.graffiti')}
                    sizeClass="modal-md"
                    bodyClassName="p-[15px]"
                >
                    <div className="flex flex-col items-center gap-[10px]">
                        <canvas
                            ref={canvasRef}
                            width={360}
                            height={220}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="border border-border bg-white cursor-crosshair"
                        />
                        <div className="flex justify-end gap-[8px] w-full text-[11px]">
                            <Button variant="secondary" onClick={() => setIsGraffitiOpen(false)}>
                                {t('chat.actions.cancel')}
                            </Button>
                            <Button variant="primary" onClick={handleSaveGraffiti}>
                                {t('chat.actions.save')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {previewImageUrl && (
                <ImagePreviewModal
                    isOpen={true}
                    onClose={() => setPreviewImageUrl(null)}
                    imageUrl={previewImageUrl}
                />
            )}
        </div>
    );
}