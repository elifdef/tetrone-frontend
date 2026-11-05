import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '../ui/Avatar';
import ImagePreviewModal from '../ui/ImagePreviewModal';
import RichText from '../common/RichText.jsx';
import PostItem from '../post/PostItem.jsx';
import { parseRichText, hasRichContent, getPlainText } from './utils/messageParser.js';
import { GroupIcon } from '../ui/Icons.jsx';

const CheckSvg = () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const StarSvg = ({ filled }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const ReplySvg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 17 4 12 9 7" />
        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
);

const ForwardSvg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 17 20 12 15 7" />
        <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
);

const EditSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const PinSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="17" x2="12" y2="22" />
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
);

const FlagSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
);

const TrashSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const FileDocSvg = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
    </svg>
);

export default function MessageItem({
    msg,
    myself,
    activeChat,
    isSelected,
    onToggleSelect,
    onToggleImportant,
    onForward,
    onReport,
    handleEditClick,
    handleDelete,
    setReplyingTo,
    togglePin
}) {
    const { t } = useTranslation();
    const [previewImageUrl, setPreviewImageUrl] = useState(null);

    const isGroupSender = msg.author_type === 'group';
    const sender = isGroupSender
        ? {
            username: activeChat?.slug,
            first_name: getPlainText(activeChat?.title),
            last_name: '',
            avatar: activeChat?.avatar
        }
        : (msg.isMine ? myself : (msg.author || {}));

    const senderName = `${sender?.first_name || ''} ${sender?.last_name || ''}`.trim() || sender?.username;
    const senderLink = !isGroupSender && sender?.username ? `/${sender.username}` : '#';

    const timeString = new Date(msg.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const isImageFile = (file) =>
        file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isVideoFile = (file) =>
        file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|ogg)$/i);
    const isAudioFile = (file) =>
        file.type?.startsWith('audio/') || file.name?.match(/\.(mp3|wav|ogg)$/i);

    return (
        <>
            <div
                id={`msg2-${msg.uuid}`}
                data-msg-id={msg.uuid}
                className={`group flex items-start gap-[8px] px-[6px] py-[5px] transition-colors ${msg.isSameAuthor ? 'same-author pt-[2px]' : 'mt-[4px]'
                    } ${isSelected
                        ? 'bg-[rgba(91,155,213,0.22)]'
                        : msg.status === 'sent' && !msg.isMine
                            ? 'bg-[rgba(91,155,213,0.1)]'
                            : 'hover:bg-bg-hover'
                    }`}
            >
                <div
                    onClick={onToggleSelect}
                    className="w-[18px] pt-[4px] flex justify-center shrink-0 cursor-pointer select-none"
                >
                    <div
                        className={`w-[13px] h-[13px] border flex items-center justify-center transition-opacity ${isSelected
                                ? 'bg-theme-link border-theme-link text-white opacity-100'
                                : 'border-border bg-bg-box opacity-0 group-hover:opacity-100'
                            }`}
                    >
                        {isSelected && <CheckSvg />}
                    </div>
                </div>

                {/* Аватар користувача або самої бесіди */}
                <div className="w-[34px] shrink-0">
                    {!msg.isSameAuthor && (
                        isGroupSender ? (
                            activeChat?.avatar ? (
                                <img
                                    src={activeChat.avatar}
                                    alt=""
                                    className="w-[34px] h-[34px] object-cover border border-border block"
                                />
                            ) : (
                                <div className="w-[34px] h-[34px] bg-bg-page border border-border flex items-center justify-center text-text-muted">
                                    <GroupIcon size={18} />
                                </div>
                            )
                        ) : (
                            <Link to={senderLink}>
                                <Avatar
                                    user={sender}
                                    className="w-[34px] h-[34px] object-cover border border-border block"
                                />
                            </Link>
                        )
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-[8px]">
                        {!msg.isSameAuthor ? (
                            isGroupSender ? (
                                <span className="text-[11px] font-bold text-theme-link flex items-center gap-[4px]">
                                    <RichText
                                        text={parseRichText(activeChat?.title || senderName)}
                                        className="post-text [&_p]:inline [&_p]:m-0"
                                        limit={100000}
                                    />
                                    <span className="text-[9px] font-normal px-[4px] py-[0.5px] bg-bg-page border border-border text-text-muted">
                                        {t('chat.badges.group_author')}
                                    </span>
                                </span>
                            ) : (
                                <Link
                                    to={senderLink}
                                    className="text-[11px] font-bold text-theme-link hover:underline"
                                >
                                    <strong>{senderName}</strong>
                                </Link>
                            )
                        ) : (
                            <span />
                        )}

                        <div className="flex items-center gap-[8px] shrink-0 ml-auto">
                            <div className="flex items-center gap-[6px] opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={onToggleImportant}
                                    title={t('chat.viewer.mark_important')}
                                    className={`bg-transparent border-none p-0 cursor-pointer flex items-center ${msg.is_important ? 'text-[#e6a100]' : 'text-text-muted hover:text-theme-link'
                                        }`}
                                >
                                    <StarSvg filled={Boolean(msg.is_important)} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReplyingTo(msg)}
                                    title={t('chat.viewer.reply')}
                                    className="bg-transparent border-none p-0 text-text-muted hover:text-theme-link cursor-pointer flex items-center"
                                >
                                    <ReplySvg />
                                </button>
                                <button
                                    type="button"
                                    onClick={onForward}
                                    title={t('chat.viewer.forward')}
                                    className="bg-transparent border-none p-0 text-text-muted hover:text-theme-link cursor-pointer flex items-center"
                                >
                                    <ForwardSvg />
                                </button>
                                {msg.isMine && (
                                    <button
                                        type="button"
                                        onClick={() => handleEditClick(msg)}
                                        title={t('chat.viewer.edit')}
                                        className="bg-transparent border-none p-0 text-text-muted hover:text-theme-link cursor-pointer flex items-center"
                                    >
                                        <EditSvg />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => togglePin(msg.uuid)}
                                    title={t('chat.viewer.pin')}
                                    className={`bg-transparent border-none p-0 cursor-pointer flex items-center ${msg.is_pinned ? 'text-theme-link' : 'text-text-muted hover:text-theme-link'
                                        }`}
                                >
                                    <PinSvg />
                                </button>
                                {!msg.isMine && (
                                    <button
                                        type="button"
                                        onClick={onReport}
                                        title={t('chat.viewer.report')}
                                        className="bg-transparent border-none p-0 text-text-muted hover:text-theme-error cursor-pointer flex items-center"
                                    >
                                        <FlagSvg />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleDelete(msg.uuid)}
                                    title={t('chat.viewer.delete')}
                                    className="bg-transparent border-none p-0 text-text-muted hover:text-theme-error cursor-pointer flex items-center"
                                >
                                    <TrashSvg />
                                </button>
                            </div>

                            <div className="text-[10px] text-text-muted">
                                <span>{timeString}</span>
                            </div>
                        </div>
                    </div>

                    {msg.reply_to && (
                        <div className="my-[4px] pl-[8px] py-[4px] border-l-[2px] border-theme-link bg-bg-page text-[11px]">
                            <div className="flex items-center gap-[6px] mb-[2px]">
                                {msg.reply_to.author && (
                                    <Avatar
                                        user={msg.reply_to.author}
                                        className="w-[16px] h-[16px] object-cover border border-border"
                                    />
                                )}
                                <strong className="text-theme-link text-[11px]">
                                    {msg.reply_to.sender_name}
                                </strong>
                                {msg.reply_to.date && (
                                    <span className="text-[10px] text-text-muted">
                                        {msg.reply_to.date}
                                    </span>
                                )}
                            </div>
                            <div className="text-text-main text-[11px] mb-[2px]">
                                <RichText
                                    text={parseRichText(msg.reply_to.text)}
                                    className="post-text [&_p]:inline [&_p]:m-0"
                                    limit={100000}
                                />
                            </div>
                            <div className="text-[10px] text-text-muted italic">
                                {t('chat.viewer.in_reply_to', { name: msg.reply_to.sender_name })}
                            </div>
                        </div>
                    )}

                    {hasRichContent(msg.text) && (
                        <div className="text-[12px] text-text-main leading-[1.4] break-words">
                            <RichText
                                text={parseRichText(msg.text)}
                                className="post-text inline [&_p]:inline [&_p]:m-0"
                                limit={100000}
                            />

                            <span className="inline-flex items-center gap-[4px] ml-[6px] text-[10px] text-text-muted">
                                {msg.status === 'sending' && (
                                    <span>{t('chat.viewer.mod_sending')}</span>
                                )}
                                {msg.is_edited && (
                                    <span>{t('chat.viewer.mod_edited')}</span>
                                )}
                                {msg.is_pinned && (
                                    <span className="text-theme-link font-bold">
                                        {t('chat.viewer.mod_pinned')}
                                    </span>
                                )}
                            </span>
                        </div>
                    )}

                    {msg.shareable?.type === 'post' && msg.shareable.post && (
                        <div className="mt-[6px] p-[8px] bg-bg-page border border-border max-w-[540px]">
                            <div className="flex items-center justify-between text-[10px] font-bold text-theme-link uppercase tracking-wider mb-[4px]">
                                <span>{t('chat.badges.forwarded_post')}</span>
                                <Link
                                    to={`/post/${msg.shareable.post.id}`}
                                    className="text-[10px] font-normal text-theme-link hover:underline normal-case"
                                >
                                    {t('chat.badges.open_post')}
                                </Link>
                            </div>
                            <PostItem
                                post={msg.shareable.post}
                                isInner={true}
                                readonly={true}
                                currentUsername={myself?.username}
                            />
                        </div>
                    )}

                    {msg.shareable?.type === 'comment' && msg.shareable.comment && (
                        <div className="mt-[6px] p-[8px] bg-bg-page border-l-[3px] border border-border border-l-theme-link max-w-[480px]">
                            <div className="flex items-center justify-between gap-[8px] mb-[6px]">
                                <span className="text-[10px] font-bold text-theme-link uppercase tracking-wider">
                                    {t('chat.badges.forwarded_comment')}
                                </span>
                                <Link
                                    to={`/post/${msg.shareable.comment.post_id}?comment=${msg.shareable.comment.id}`}
                                    className="text-[10px] text-theme-link hover:underline"
                                >
                                    {t('chat.badges.go_to_comment')}
                                </Link>
                            </div>

                            {msg.shareable.comment.user && (
                                <div className="flex items-center gap-[6px] mb-[4px]">
                                    <Link to={`/${msg.shareable.comment.user.username}`}>
                                        <Avatar
                                            user={msg.shareable.comment.user}
                                            className="w-[22px] h-[22px] object-cover border border-border block"
                                        />
                                    </Link>
                                    <Link
                                        to={`/${msg.shareable.comment.user.username}`}
                                        className="text-[11px] font-bold text-theme-link hover:underline"
                                        style={
                                            msg.shareable.comment.user.personalization?.username_color
                                                ? { color: msg.shareable.comment.user.personalization.username_color }
                                                : undefined
                                        }
                                    >
                                        {msg.shareable.comment.user.first_name} {msg.shareable.comment.user.last_name}
                                    </Link>
                                </div>
                            )}

                            <div className="text-[11px] text-text-main leading-[1.35]">
                                <RichText
                                    text={parseRichText(msg.shareable.comment.content)}
                                    className="comment-text"
                                />
                            </div>
                        </div>
                    )}

                    {msg.shareable?.type === 'user' && msg.shareable.user && (() => {
                        const profileUser = msg.shareable.user;
                        const bannerImage = profileUser.personalization?.banner_image;
                        const bannerColor = profileUser.personalization?.banner_color;
                        const usernameColor = profileUser.personalization?.username_color;

                        return (
                            <div className="mt-[6px] border border-border bg-bg-page max-w-[340px] overflow-hidden">
                                {/* Бейдж-шапка пересланого профілю */}
                                <div className="px-[8px] py-[4px] bg-bg-box border-b border-border flex items-center justify-between text-[10px] font-bold text-theme-link uppercase tracking-wider">
                                    <span>{t('chat.badges.shared_profile')}</span>
                                    <Link
                                        to={`/${profileUser.username}`}
                                        className="text-[10px] font-normal text-theme-link hover:underline normal-case"
                                    >
                                        {t('chat.badges.open_profile')}
                                    </Link>
                                </div>

                                {/* Міні-банер / градієнт користувача */}
                                <div
                                    className="h-[48px] w-full relative bg-cover bg-center"
                                    style={{
                                        background: bannerImage
                                            ? `url(${bannerImage}) center/cover no-repeat`
                                            : (bannerColor || 'var(--theme-header-bg)')
                                    }}
                                />

                                {/* Вміст картки профілю */}
                                <div className="px-[10px] pb-[10px] pt-[0px] relative flex items-end gap-[10px]">
                                    <div className="-mt-[20px] shrink-0 relative z-10">
                                        <Link to={`/${profileUser.username}`}>
                                            <Avatar
                                                user={profileUser}
                                                className="w-[40px] h-[40px] object-cover border-2 border-bg-box block bg-bg-box"
                                            />
                                        </Link>
                                    </div>

                                    <div className="min-w-0 flex-1 pt-[4px]">
                                        <Link
                                            to={`/${profileUser.username}`}
                                            className="text-[11px] font-bold hover:underline block truncate"
                                            style={usernameColor ? { color: usernameColor } : { color: 'var(--theme-link)' }}
                                        >
                                            {`${profileUser.first_name || ''} ${profileUser.last_name || ''}`.trim() || profileUser.username}
                                        </Link>
                                        <div className="text-[10px] text-text-muted truncate">
                                            @{profileUser.username}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {msg.files?.length > 0 && (
                        <div className="mt-[6px] flex flex-wrap gap-[8px]">
                            {msg.files.map((file, idx) => {
                                if (isImageFile(file)) {
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setPreviewImageUrl(file.url)}
                                            className="max-w-[380px] border border-border overflow-hidden bg-bg-page cursor-pointer hover:opacity-95 transition-opacity"
                                        >
                                            <img
                                                src={file.url}
                                                alt={file.name || ''}
                                                loading="lazy"
                                                className="max-h-[220px] w-auto object-cover block"
                                            />
                                        </div>
                                    );
                                }

                                if (isVideoFile(file)) {
                                    return (
                                        <div key={idx} className="max-w-[380px] border border-border overflow-hidden bg-black">
                                            <video
                                                src={file.url}
                                                controls
                                                className="max-h-[240px] w-full block"
                                            />
                                        </div>
                                    );
                                }

                                if (isAudioFile(file)) {
                                    return (
                                        <div key={idx} className="w-full max-w-[340px] p-[6px] bg-bg-page border border-border">
                                            <div className="text-[10px] text-text-muted mb-[4px] truncate">{file.name}</div>
                                            <audio src={file.url} controls className="w-full h-[32px]" />
                                        </div>
                                    );
                                }

                                return (
                                    <a
                                        key={idx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-[6px] px-[10px] py-[6px] bg-bg-page border border-border text-[11px] text-theme-link hover:underline"
                                    >
                                        <FileDocSvg />
                                        <span className="max-w-[220px] truncate">{file.name}</span>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {previewImageUrl && (
                <ImagePreviewModal
                    isOpen={true}
                    onClose={() => setPreviewImageUrl(null)}
                    imageUrl={previewImageUrl}
                />
            )}
        </>
    );
}