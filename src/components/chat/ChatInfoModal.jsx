import { useState, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@context/AuthContext';
import Modal from '@components/modals/Modal.jsx';
import ImagePreviewModal from '@ui/ImagePreviewModal';
import { SavedMessagesIcon } from '@ui/Icons.jsx';
import { parseRichText } from './utils/messageParser.js';
import GroupInfoSection from './components/modals/info/GroupInfoSection.jsx';
import PrivateChatInfoSection from './components/modals/info/PrivateChatInfoSection.jsx';
import ChatMediaGrid from './components/modals/info/ChatMediaGrid.jsx';
import ChatSharedList from './components/modals/info/ChatSharedList.jsx';

export default function ChatInfoModal({
    chat,
    messages = [],
    friendsList = [],
    currentUser: fallbackUser,
    onClose,
    onScrollToMessage,
    onUpdateGroupInfo,
    onInviteMember,
    onUpdateMemberRole,
    onKickMember,
    onDeleteChat,
    onBlockUser
}) {
    const { t } = useTranslation();
    const { user: authUser } = useContext(AuthContext);
    const currentUser = authUser || fallbackUser;

    const [activeTab, setActiveTab] = useState('info');
    const [previewImage, setPreviewImage] = useState(null);
    const { mediaFiles, audioFiles, documentFiles, links } = useMemo(() => {
        const allFiles = messages
            .flatMap(msg => (msg.files || []).map(file => ({
                ...file,
                messageId: msg.uuid,
                createdAt: msg.created_at
            })))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const media = allFiles.filter(f =>
            f.type?.startsWith('image/') ||
            f.type?.startsWith('video/') ||
            f.name?.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i)
        );
        const audio = allFiles.filter(f =>
            f.type?.startsWith('audio/') ||
            f.name?.match(/\.(mp3|ogg|wav)$/i)
        );
        const docs = allFiles.filter(f => !media.includes(f) && !audio.includes(f));

        const extractedLinks = messages
            .flatMap(msg => {
                const doc = parseRichText(msg.text);
                if (!doc?.content) return [];
                const found = [];
                const walk = (nodes) => {
                    nodes.forEach(node => {
                        if (node.marks) {
                            const linkMark = node.marks.find(m => m.type === 'link');
                            if (linkMark) {
                                found.push({
                                    url: linkMark.attrs.href,
                                    text: node.text,
                                    messageId: msg.uuid,
                                    createdAt: msg.created_at
                                });
                            }
                        }
                        if (node.content) walk(node.content);
                    });
                };
                walk(doc.content);
                return found;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return { mediaFiles: media, audioFiles: audio, documentFiles: docs, links: extractedLinks };
    }, [messages]);

    if (!chat) return null;

    const handleJumpToMessage = (messageId) => {
        onClose();
        if (onScrollToMessage) {
            setTimeout(() => onScrollToMessage(messageId), 100);
        }
    };

    const tabs = [
        { key: 'info', label: t('chat.info_modal.tab_info'), count: null },
        { key: 'media', label: t('chat.info_modal.tab_media'), count: mediaFiles.length },
        { key: 'files', label: t('chat.info_modal.tab_files'), count: documentFiles.length },
        { key: 'audio', label: t('chat.info_modal.tab_audio'), count: audioFiles.length },
        { key: 'links', label: t('chat.info_modal.tab_links'), count: links.length }
    ];

    return (
        <>
            <Modal
                isOpen={true}
                onClose={onClose}
                title={chat.is_group ? t('chat.info_modal.group_info') : t('chat.info_modal.chat_info')}
                sizeClass="modal-md"
                bodyClassName="p-[15px]"
            >
                <div className="flex gap-[15px] mb-[15px] border-b border-border text-[11px] font-bold">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${
                                activeTab === tab.key
                                    ? 'border-theme-link text-text-main'
                                    : 'border-transparent text-text-muted hover:text-theme-link'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.count !== null && (
                                <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div>
                    {activeTab === 'info' && (
                        chat.is_saved ? (
                            <div className="flex flex-col items-center p-[20px] bg-bg-page border border-border text-center">
                                <div className="w-[60px] h-[60px] bg-theme-link/15 border border-theme-link/40 mb-[10px] flex items-center justify-center text-theme-link">
                                    <SavedMessagesIcon size={28} />
                                </div>
                                <div className="font-bold text-[14px] text-theme-link mb-[6px]">
                                    {t('chat.saved_messages')}
                                </div>
                                <div className="text-[11px] text-text-main max-w-[360px] leading-[1.45]">
                                    {t('chat.saved_description')}
                                </div>
                            </div>
                        ) : chat.is_group ? (
                            <GroupInfoSection
                                chat={chat}
                                currentUser={currentUser}
                                friendsList={friendsList}
                                onUpdateGroupInfo={onUpdateGroupInfo}
                                onInviteMember={onInviteMember}
                                onUpdateMemberRole={onUpdateMemberRole}
                                onKickMember={onKickMember}
                            />
                        ) : (
                            <PrivateChatInfoSection
                                chat={chat}
                                currentUser={currentUser}
                                onBlockUser={onBlockUser}
                                onDeleteChat={onDeleteChat}
                            />
                        )
                    )}

                    {activeTab === 'media' && (
                        <ChatMediaGrid
                            mediaFiles={mediaFiles}
                            onPreviewImage={setPreviewImage}
                            onJumpToMessage={handleJumpToMessage}
                        />
                    )}

                    {activeTab === 'files' && (
                        <ChatSharedList
                            items={documentFiles}
                            onJumpToMessage={handleJumpToMessage}
                        />
                    )}

                    {activeTab === 'audio' && (
                        <ChatSharedList
                            items={audioFiles}
                            onJumpToMessage={handleJumpToMessage}
                        />
                    )}

                    {activeTab === 'links' && (
                        <ChatSharedList
                            items={links}
                            isLinks={true}
                            onJumpToMessage={handleJumpToMessage}
                        />
                    )}
                </div>
            </Modal>

            {previewImage && (
                <ImagePreviewModal
                    isOpen={true}
                    onClose={() => setPreviewImage(null)}
                    imageUrl={previewImage}
                />
            )}
        </>
    );
}