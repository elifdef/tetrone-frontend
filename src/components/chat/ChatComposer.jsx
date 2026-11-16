import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import SmartEditor from '../editor/SmartEditor';
import { getPlainText } from './utils/messageParser.js';
import { GroupIcon } from '../ui/Icons.jsx';
import ComposerReplyEditBanner from './components/composer/ComposerReplyEditBanner.jsx';
import ComposerAttachmentsPreview from './components/composer/ComposerAttachmentsPreview.jsx';
import AttachMenuDropdown from './components/composer/AttachMenuDropdown.jsx';
import GraffitiModal from './components/composer/GraffitiModal.jsx';

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
    pendingForward,
    handleSend,
    handleCancelReplyEdit,
    handleFileChange,
    handleAddGraffitiFile,
    handleRemoveFile,
    onTyping
}) {
    const { t } = useTranslation();
    const [isGraffitiOpen, setIsGraffitiOpen] = useState(false);
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        isInitialMountRef.current = true;
    }, [activeChatSlug, editingMessage?.uuid, editorResetKey]);

    return (
        <div className="p-[10px_12px] bg-header-bg">
            <ComposerReplyEditBanner
                editingMessage={editingMessage}
                replyingTo={replyingTo}
                replyingToName={replyingToName}
                pendingForward={pendingForward}
                onCancel={handleCancelReplyEdit}
            />

            <ComposerAttachmentsPreview
                files={files}
                onRemoveFile={handleRemoveFile}
            />

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
                                const currentPlain = getPlainText(val);
                                const prevPlain = getPlainText(text);

                                if (isInitialMountRef.current) {
                                    isInitialMountRef.current = false;
                                    if (currentPlain === prevPlain) {
                                        return;
                                    }
                                }

                                if (currentPlain !== prevPlain || JSON.stringify(val) !== JSON.stringify(text)) {
                                    onTyping?.();
                                }
                            }}
                            onEnter={handleSend}
                            onPasteFiles={(pastedFiles) => {
                                if (handleFileChange) {
                                    handleFileChange({ target: { files: pastedFiles } });
                                }
                            }}
                            placeholder={t('chat.composer.placeholder')}
                            className="min-h-[58px] text-[12px] outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-[8px] mt-[8px]">
                        <Button variant="primary" onClick={handleSend}>
                            {t('chat.composer.send')}
                        </Button>

                        <AttachMenuDropdown
                            onFileChange={handleFileChange}
                            onOpenGraffiti={() => setIsGraffitiOpen(true)}
                        />
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

            <GraffitiModal
                isOpen={isGraffitiOpen}
                onClose={() => setIsGraffitiOpen(false)}
                onSave={handleAddGraffitiFile}
            />
        </div>
    );
}