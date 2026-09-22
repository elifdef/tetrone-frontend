import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../ui/Button';
import {
    ImageIcon, VideoIcon, AudioIcon,
    DocumentIcon as FileIcon, CloseIcon
} from '../../ui/Icons';
import Avatar from '../../ui/Avatar';
import SmartEditor from "../../editor/SmartEditor";
import { getPlainText } from '../utils/messageParser';

const ClassicImagePreview = ({ file, onRemove }) => {
    return (
        <div className="text-[11px] bg-bg-box p-[4px_10px] border border-border flex items-center gap-[8px]">
            <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">{file.name}</span>
            <button
                className="bg-transparent border border-transparent text-theme-error cursor-pointer p-[2px] flex items-center justify-center hover:border-theme-error transition-colors"
                onClick={onRemove}
            >
                <CloseIcon width={10} height={10} />
            </button>
        </div>
    );
};

export default function ClassicChatComposer({
                                                text, setText, files, editingMessage, replyingTo, replyingToName,
                                                handleCancelReplyEdit, handleRemoveFile, handleFileChange, handleSend, onTyping,
                                                myself, targetUser
                                            }) {
    const { t } = useTranslation();
    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const attachMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) setIsAttachOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (editingMessage) {
            if (!editingMessage.text) {
                setText('');
                return;
            }
            try {
                const parsedText = JSON.parse(editingMessage.text);
                setText(parsedText);
            } catch (e) {
                setText(editingMessage.text);
            }
        }
    }, [editingMessage, setText]);

    const isEditorEmpty = !text || (typeof text === 'object' && text.content?.length === 1 && !text.content[0].content) || (typeof text === 'string' && !text.trim());
    const isSendDisabled = isEditorEmpty && files.length === 0;

    const handleFileSelect = (e) => {
        handleFileChange(e);
        setIsAttachOpen(false);
    };

    const previewContent = editingMessage
        ? getPlainText(editingMessage.text)
        : replyingTo
            ? getPlainText(replyingTo.text)
            : '';

    return (
        <div className="bg-bg-page shrink-0 w-full box-border">
            {(editingMessage || replyingTo) && (
                <div className="border-l-[2px] border-theme-link bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.05)] p-[6px_10px] mb-[10px] flex justify-between items-start">
                    <div className="flex-1 overflow-hidden">
                        <div className="text-[11px] font-bold text-theme-link mb-[2px]">
                            {editingMessage ? t('messages.editing') : replyingToName}
                        </div>
                        <div className="text-[11px] text-text-main whitespace-nowrap overflow-hidden text-ellipsis">
                            {previewContent}
                        </div>
                    </div>
                    <button
                        className="bg-transparent border border-border text-text-muted p-[2px] cursor-pointer hover:bg-bg-page hover:text-theme-error hover:border-theme-error ml-[10px] transition-colors"
                        onClick={handleCancelReplyEdit}
                    >
                        <CloseIcon width={12} height={12} />
                    </button>
                </div>
            )}

            {files.length > 0 && (
                <div className="flex flex-wrap gap-[10px] mb-[10px] p-[10px_15px] bg-[rgba(0,0,0,0.02)] border border-border">
                    {files.map((f, idx) => (
                        <ClassicImagePreview key={idx} file={f} onRemove={() => handleRemoveFile(idx)} />
                    ))}
                </div>
            )}

            <div className="flex gap-[15px] items-start w-full">
                <Avatar user={myself} className="w-[50px] h-[50px] object-cover border border-border shrink-0 block" />

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="w-full border border-input-border bg-input-bg text-text-main mb-[8px] focus-within:border-theme-link transition-colors">
                        <SmartEditor
                            key={editingMessage ? `edit-${editingMessage.id}` : 'new-message'}
                            className="w-full min-h-[60px] max-h-[150px] overflow-y-auto p-[6px] text-[12px] outline-none custom-scrollbar"
                            value={text}
                            onChange={(val) => { setText(val); if (onTyping) onTyping(); }}
                            placeholder={t('messages.write_message')}
                            onEnter={handleSend}
                        />
                    </div>

                    <div className="flex justify-between items-center relative">
                        <Button
                            className="bg-theme-btn-bg text-theme-btn-text border border-border p-[5px_15px] font-bold text-[11px] cursor-pointer hover:bg-theme-btn-hover disabled:opacity-50"
                            onClick={handleSend}
                            disabled={isSendDisabled}
                        >
                            {editingMessage ? t('action.save') : t('action.send')}
                        </Button>

                        <div className="relative" ref={attachMenuRef}>
                            <span
                                className="cursor-pointer text-theme-link text-[11px] hover:underline"
                                onClick={() => setIsAttachOpen(!isAttachOpen)}
                            >
                                {t('action.attach')}
                            </span>

                            {isAttachOpen && (
                                <div className="absolute bottom-[100%] right-0 mb-[10px] bg-bg-box border border-border shadow-[0_-2px_10px_rgba(0,0,0,0.15)] min-w-[180px] z-[100] flex flex-col">
                                    <label className="flex items-center gap-[10px] p-[10px_15px] cursor-pointer text-[12px] text-text-main hover:bg-bg-page transition-colors">
                                        <ImageIcon width={16} height={16} /> <span>{t('action.attach_image')}</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                                    </label>
                                    <label className="flex items-center gap-[10px] p-[10px_15px] cursor-pointer text-[12px] text-text-main hover:bg-bg-page transition-colors">
                                        <VideoIcon width={16} height={16} /> <span>{t('action.attach_video')}</span>
                                        <input type="file" accept="video/*" multiple className="hidden" onChange={handleFileSelect} />
                                    </label>
                                    <label className="flex items-center gap-[10px] p-[10px_15px] cursor-pointer text-[12px] text-text-main hover:bg-bg-page transition-colors">
                                        <AudioIcon width={16} height={16} /> <span>{t('action.attach_audio')}</span>
                                        <input type="file" accept="audio/*" multiple className="hidden" onChange={handleFileSelect} />
                                    </label>
                                    <label className="flex items-center gap-[10px] p-[10px_15px] cursor-pointer text-[12px] text-text-main hover:bg-bg-page transition-colors">
                                        <FileIcon width={16} height={16} /> <span>{t('action.attach_document')}</span>
                                        <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Avatar user={targetUser} className="w-[50px] h-[50px] object-cover border border-border shrink-0 block" />
            </div>
        </div>
    );
}