import { memo, useState, useRef } from 'react';
import { Link, useParams } from "react-router";
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import useOnClickOutside from '../editor/hooks/useOnClickOutside';
import { EditIcon, DeleteIcon, ReportIcon, DotsIcon } from '../ui/Icons';
import Avatar from '../ui/Avatar';

const PostHeader = ({ post, isOwner, onEdit, onDelete, onReport, currentUsername, readonly }) => {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { username: currentProfileUsername } = useParams();

    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useOnClickOutside(menuRef, () => setShowMenu(false));

    // Перевіряємо наявність автора (тепер це поліморфний зв'язок)
    if (!post || !post.author) return null;

    const authorIsSpace = post.author_type?.includes('Space');
    const targetIsSpace = post.target_type?.includes('Space');
    const targetIsUser = post.target_type?.includes('User');

    const author = post.author;
    const target = post.target;
    const isAvatarUpdate = post.is_avatar_update === true;

    // ФІКС 1: Строга перевірка авторства через username реального творця або поліморфного автора
    const actualCreatorUsername = post.user?.username;
    const isAuthor = currentUsername ? (currentUsername === actualCreatorUsername || currentUsername === author.username) : false;

    // Логіка відображення
    const authorLink = `/${author.username}`;
    const authorName = authorIsSpace ? author.name : `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.username;
    const authorNameColor = authorIsSpace ? undefined : author?.personalization?.username_color;

    // Чи потрібно показувати ціль (стіну юзера або групу)?
    // Не показуємо, якщо це своя стіна або якщо ми вже знаходимось на сторінці цієї цілі
    const isPostedOnOwnWall = target?.username === author.username;
    const isViewingTargetWall = target?.username === currentProfileUsername;
    const showTarget = !!target && !isPostedOnOwnWall && !isViewingTargetWall && !isAvatarUpdate;

    const canEdit = !readonly && onEdit && isAuthor && !isAvatarUpdate;
    const canDelete = !readonly && onDelete && (isAuthor || isOwner);
    const canReport = !readonly && onReport && !isAuthor;

    const showActions = canEdit || canDelete || canReport;

    const avatarUpdateText = post.user?.gender === 2
        ? t('post.updated_avatar_female')
        : t('post.updated_avatar_male');

    const menuItemClass = "w-full text-left px-[8px] py-[6px] flex items-center gap-[6px] text-text-main hover:bg-bg-page hover:text-theme-link hover:underline cursor-pointer border-none bg-transparent outline-none text-[11px] font-normal transition-none";
    const dangerItemClass = "w-full text-left px-[8px] py-[6px] flex items-center gap-[6px] text-theme-error hover:bg-[rgba(255,51,71,0.1)] hover:text-theme-error hover:underline cursor-pointer border-none bg-transparent outline-none text-[11px] font-normal transition-none";

    return (
        <div className="border-t border-border pt-[5px] flex items-start max-md:px-[10px] max-md:items-center">
            <Link to={authorLink} className="shrink-0 mr-[10px]" onClick={(e) => readonly && e.preventDefault()}>
                <Avatar user={author} className="w-[50px] h-[50px] object-cover block rounded-[4px]" />
            </Link>

            <div className="flex flex-col text-[11px] flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-[4px] leading-[1.4]">
                    <Link
                        to={authorLink}
                        className={`font-bold text-[12px] no-underline ${readonly ? 'cursor-default' : 'hover:underline text-theme-link'}`}
                        style={authorNameColor ? { color: authorNameColor } : undefined}
                        onClick={(e) => readonly && e.preventDefault()}
                    >
                        {authorName}
                    </Link>

                    {authorIsSpace && post.user && (
                        <span className="text-text-muted">
                            ({t('spaces.posted_by_admin')} <Link to={`/${post.user.username}`} className="text-text-muted hover:underline" onClick={(e) => readonly && e.preventDefault()}>{post.user.first_name}</Link>)
                        </span>
                    )}

                    {isAvatarUpdate && !authorIsSpace && (
                        <span className="text-text-main">{avatarUpdateText}</span>
                    )}

                    {showTarget && targetIsUser && (
                        <span className="text-text-main">
                            {t(`post.wrote_on_wall_${post.user?.gender === 2 ? 'female' : 'male'}`)}
                            <Link to={`/${target.username}`} className="text-theme-link font-bold hover:underline ml-[4px]" onClick={(e) => readonly && e.preventDefault()}>
                                {target.first_name} {target.last_name}
                            </Link>
                        </span>
                    )}

                    {showTarget && targetIsSpace && (
                        <span className="text-text-main flex items-center gap-[4px]">
                            <span className="text-[10px] text-text-muted">▶</span>
                            <Link to={`/${target.username}`} className="text-theme-link font-bold hover:underline" onClick={(e) => readonly && e.preventDefault()}>
                                {target.name}
                            </Link>
                        </span>
                    )}
                </div>

                <Link to={`/post/${post.id}`} className={`text-[10px] mt-[2px] no-underline ${readonly ? 'text-text-muted cursor-default' : 'text-text-muted hover:underline'}`} onClick={(e) => readonly && e.preventDefault()}>
                    {formatDate(post.created_at)}
                </Link>
            </div>

            {showActions && !readonly && (
                <div className="relative ml-auto" ref={menuRef}>
                    <button
                        type="button"
                        className={`bg-transparent border-none text-text-muted cursor-pointer p-[6px] flex items-center justify-center outline-none transition-none rounded-[2px] ${showMenu ? 'text-theme-link bg-bg-page' : 'hover:bg-bg-page hover:text-text-main'}`}
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <DotsIcon width={16} height={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-[2px] bg-bg-box border border-border shadow-sm flex flex-col min-w-[150px] py-[2px] z-[100] rounded-[2px]">
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
    );
};

export default memo(PostHeader, (prev, next) => prev.post.id === next.post.id);