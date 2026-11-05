import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ChatService from '../../services/chat.service';
import Modal from './Modal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { GroupIcon } from '../ui/Icons';
import { getPlainText, toTipTapDoc } from '../chat/utils/messageParser';
import { notifySuccess, notifyError } from '../common/Notify';

export default function ShareToChatModal({
    isOpen,
    onClose,
    shareableType,
    shareableId,
    titlePreview = ''
}) {
    const { t } = useTranslation();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendingSlug, setSendingSlug] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setSearchQuery('');
        setCommentText('');

        ChatService.getChats()
            .onSuccess((res) => {
                if (Array.isArray(res?.chats)) {
                    setChats(res.chats);
                }
                setLoading(false);
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                setLoading(false);
            });
    }, [isOpen, t]);

    const filteredChats = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return chats.filter((chat) => {
            if (!chat.is_saved && (chat.is_blocked || chat.target_user?.is_deleted || chat.target_user?.is_banned)) {
                return false;
            }
            if (!q) return true;

            const name = chat.is_saved
                ? t('chat.saved_messages').toLowerCase()
                : chat.is_group
                    ? getPlainText(chat.title).toLowerCase()
                    : `${chat.target_user?.first_name || ''} ${chat.target_user?.last_name || ''} ${chat.target_user?.username || ''}`.toLowerCase();

            return name.includes(q);
        });
    }, [chats, searchQuery, t]);

    const handleSendToChat = (chatSlug) => {
        if (sendingSlug) return;
        setSendingSlug(chatSlug);

        const trimmed = commentText.trim();
        const richDoc = trimmed ? toTipTapDoc(trimmed) : null;

        ChatService.sendMessage(
            chatSlug,
            richDoc,
            [],
            { type: shareableType, id: shareableId }
        )
            .onSuccess((res) => {
                notifySuccess(t(`api.success.${res.code}`));
                setSendingSlug(null);
                onClose();
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                setSendingSlug(null);
            });
    };

    const getEntityLabel = () => {
        switch (shareableType) {
            case 'post':
                return t('chat.share.type_post');
            case 'comment':
                return t('chat.share.type_comment');
            case 'user':
                return t('chat.share.type_user');
            default:
                return t('chat.share.title');
        }
    };

    const modalFooter = (
        <Button variant="secondary" onClick={onClose}>
            {t('action.cancel')}
        </Button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getEntityLabel()}
            sizeClass="modal-md"
            bodyClassName="!p-0 flex flex-col max-h-[75vh]"
            footer={modalFooter}
        >
            <div className="p-[10px] border-b border-border flex flex-col gap-[8px] bg-bg-page">
                {titlePreview && (
                    <div className="text-[11px] text-text-muted truncate border-l-[2px] border-theme-link pl-[6px]">
                        {titlePreview}
                    </div>
                )}

                <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('chat.share.comment_placeholder')}
                    className="w-full px-[8px] py-[6px] text-[11px] bg-bg-box border border-border text-text-main outline-none focus:border-theme-link"
                />

                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('chat.share.search_chats')}
                    className="w-full px-[8px] py-[5px] text-[11px] bg-bg-box border border-border text-text-main outline-none focus:border-theme-link"
                />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border min-h-[180px] max-h-[340px]">
                {loading ? (
                    <div className="p-[20px] text-center text-[11px] text-text-muted">
                        {t('common.loading')}
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="p-[20px] text-center text-[11px] text-text-muted">
                        {t('chat.share.no_chats')}
                    </div>
                ) : (
                    filteredChats.map((chat) => {
                        const chatName = chat.is_saved
                            ? t('chat.saved_messages')
                            : chat.is_group
                                ? getPlainText(chat.title)
                                : `${chat.target_user?.first_name || ''} ${chat.target_user?.last_name || ''}`.trim() || chat.target_user?.username;

                        const isSending = sendingSlug === chat.slug;

                        return (
                            <div
                                key={chat.slug}
                                className="flex items-center justify-between gap-[8px] px-[12px] py-[8px] hover:bg-bg-hover transition-colors"
                            >
                                <div className="flex items-center gap-[8px] min-w-0 flex-1">
                                    {chat.is_group ? (
                                        chat.avatar ? (
                                            <img
                                                src={chat.avatar}
                                                alt=""
                                                className="w-[30px] h-[30px] object-cover border border-border shrink-0"
                                            />
                                        ) : (
                                            <div className="w-[30px] h-[30px] bg-bg-page border border-border flex items-center justify-center text-text-muted shrink-0">
                                                <GroupIcon size={16} />
                                            </div>
                                        )
                                    ) : (
                                        <Avatar
                                            user={chat.target_user}
                                            className="w-[30px] h-[30px] object-cover border border-border shrink-0"
                                        />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-bold text-text-main truncate">
                                            {chatName}
                                        </div>
                                        {!chat.is_saved && !chat.is_group && chat.target_user?.username && (
                                            <div className="text-[10px] text-text-muted truncate">
                                                @{chat.target_user.username}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    disabled={Boolean(sendingSlug)}
                                    onClick={() => handleSendToChat(chat.slug)}
                                    className="shrink-0 text-[10px] px-[10px] py-[4px]"
                                >
                                    {isSending ? t('common.loading') : t('chat.share.send_btn')}
                                </Button>
                            </div>
                        );
                    })
                )}
            </div>
        </Modal>
    );
}