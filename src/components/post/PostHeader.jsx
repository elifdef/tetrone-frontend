import { memo, useState, useRef } from 'react';
import { Link, useParams } from "react-router";
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import useOnClickOutside from '../editor/hooks/useOnClickOutside';
import { EditIcon, DeleteIcon, ReportIcon, DotsIcon, PinIcon, UnpinIcon, RocketIcon } from '../ui/Icons';
import Avatar from '../ui/Avatar';

const PostHeader = ({ post, isOwner, onEdit, onDelete, onReport, currentUsername, readonly, isAdmin = false, onPublishNow, onPinToggle }) => {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { username: currentProfileUsername } = useParams();

    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useOnClickOutside(menuRef, () => setShowMenu(false));

    if (!post || !post.author) return null;

    const authorIsSpace = post.author_type === 'space';
    const targetIsSpace = post.target_type === 'space';
    const targetIsUser = post.target_type === 'user';

    const author = post.author;
    const target = post.target;
    const isAvatarUpdate = post.is_avatar_update === true;

    const isEdited = post.updated_at && post.updated_at !== post.created_at;
    const isScheduled = post.is_published === false;
    const isPinned = post.is_pinned === true;

    const isAuthor = currentUsername && (currentUsername === author.username);

    const wallOwnerUsername = target ? target.username : author.username;
    const isWallOwner = currentUsername && (currentUsername === wallOwnerUsername);

    const canEdit = onEdit && (isAdmin || (isAuthor && !isAvatarUpdate && !readonly));
    const canDelete = onDelete && (isAdmin || ((isAuthor || isOwner) && !readonly));
    const canReport = onReport && !isAuthor && !readonly;
    const canPin = onPinToggle && isWallOwner;

    const showActions = canEdit || canDelete || canReport || isScheduled || canPin;

    const authorLink = `/${author.username}`;
    const authorName = authorIsSpace ? author.name : `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.username;
    const authorNameColor = authorIsSpace ? undefined : author?.personalization?.username_color;

    const isPostedOnOwnWall = target?.username === author.username;
    const isViewingTargetWall = target?.username === currentProfileUsername;
    const showTarget = !!target && !isPostedOnOwnWall && !isViewingTargetWall && !isAvatarUpdate;

    const avatarUpdateText = author.gender === 2 ? t('post.updated_avatar_female') : t('post.updated_avatar_male');
    const wroteOnWallText = t(`post.wrote_on_wall_${author.gender === 2 ? 'female' : 'male'}`);

    const menuItemClass = "w-full text-left px-[8px] py-[6px] flex items-center gap-[6px] text-text-main hover:bg-bg-page hover:text-theme-link hover:underline cursor-pointer border-none bg-transparent outline-none text-[11px] font-normal transition-none";
    const dangerItemClass = "w-full text-left px-[8px] py-[6px] flex items-center gap-[6px] text-theme-error hover:bg-[rgba(255,51,71,0.1)] hover:text-theme-error hover:underline cursor-pointer border-none bg-transparent outline-none text-[11px] font-normal transition-none";

    const handleLinkClick = (e) => {
        if (readonly && !isAdmin) e.preventDefault();
    };

    return (
        <div className="flex flex-col pt-[5px]">
            <div className="border-t border-border pt-[5px] flex items-start max-md:px-[10px] max-md:items-center">
                <Link to={authorLink} className="shrink-0 mr-[10px]" onClick={handleLinkClick}>
                    <Avatar user={author} className="w-[50px] h-[50px] object-cover block" />
                </Link>

                <div className="flex flex-col text-[11px] flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-[4px] leading-[1.4]">
                        <Link
                            to={authorLink}
                            className="font-bold text-[12px] no-underline hover:underline text-theme-link"
                            style={authorNameColor ? { color: authorNameColor } : undefined}
                            onClick={handleLinkClick}
                        >
                            {authorName}
                        </Link>

                        {isAvatarUpdate && !authorIsSpace && (
                            <span className="text-text-main">{avatarUpdateText}</span>
                        )}

                        {showTarget && targetIsUser && (
                            <span className="text-text-main">
                                {wroteOnWallText}
                                <Link to={`/${target.username}`} className="text-theme-link font-bold hover:underline ml-[4px]" onClick={handleLinkClick}>
                                    {target.first_name} {target.last_name}
                                </Link>
                            </span>
                        )}

                        {showTarget && targetIsSpace && (
                            <span className="text-text-main flex items-center gap-[4px]">
                                <span className="text-[10px] text-text-muted">▶</span>
                                <Link to={`/${target.username}`} className="text-theme-link font-bold hover:underline" onClick={handleLinkClick}>
                                    {target.name}
                                </Link>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-[4px] mt-[2px] text-[10px] text-text-muted">

                        <Link to={`/post/${post.id}`} className="text-text-muted hover:underline no-underline" onClick={handleLinkClick}>
                            {formatDate(post.created_at)}
                        </Link>

                        {isEdited && !isScheduled && (
                            <span
                                className="italic text-text-muted cursor-help"
                                title={`${t('common.edited')} ${formatDate(post.updated_at)}`} // Виправлено зайву дужку тут
                            >
                                ({t('common.edited')})
                            </span>
                        )}

                    </div>
                </div>

                {showActions && (
                    <div className="relative ml-auto" ref={menuRef}>
                        <button
                            type="button"
                            className={`bg-transparent border-none text-text-muted cursor-pointer p-[6px] flex items-center justify-center outline-none transition-none ${showMenu ? 'text-theme-link bg-bg-page' : 'hover:bg-bg-page hover:text-text-main'}`}
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <DotsIcon width={16} height={16} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-[2px] bg-bg-box border border-border shadow-sm flex flex-col min-w-[150px] py-[2px] z-[100]">
                                {isScheduled && onPublishNow && (
                                    <button type="button" className={menuItemClass} onClick={() => { onPublishNow(post.id); setShowMenu(false); }}>
                                        <RocketIcon width={14} height={14} /> {t('post.publish_now')}
                                    </button>
                                )}

                                {canPin && !isScheduled && (
                                    <button type="button" className={menuItemClass} onClick={() => { onPinToggle(post.id); setShowMenu(false); }}>
                                        {isPinned ? <UnpinIcon width={14} height={14} /> : <PinIcon width={14} height={14} />}
                                        {isPinned ? t('common.unpin') : t('common.pin')}
                                    </button>
                                )}

                                {canEdit && (
                                    <button type="button" className={menuItemClass} onClick={() => { onEdit(post); setShowMenu(false); }}>
                                        <EditIcon width={14} height={14} /> {t('action.edit')}
                                    </button>
                                )}
                                {canDelete && (
                                    <button type="button" className={dangerItemClass} onClick={() => { onDelete(post.id); setShowMenu(false); }}>
                                        <DeleteIcon width={14} height={14} /> {t('action.delete')}
                                    </button>
                                )}
                                {canReport && (
                                    <button type="button" className={menuItemClass} onClick={() => { onReport(post.id); setShowMenu(false); }}>
                                        <ReportIcon width={14} height={14} /> {t('reports.title')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(PostHeader, (prev, next) => prev.post.id === next.post.id);