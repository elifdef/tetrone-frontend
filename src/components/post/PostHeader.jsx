import { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { EditIcon, DeleteIcon, ReportIcon, DotsIcon } from '../ui/Icons';
import Avatar from '../ui/Avatar';

export default function PostHeader({ post, isOwner, onEdit, onDelete, onReport, currentUserId }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { username: currentProfileUsername } = useParams();

    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showMenu && !e.target.closest('.tetrone-post-actions-container')) {
                setShowMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMenu]);

    // ЗАХИСТ ВІД ПАДІННЯ: Якщо пост ще вантажиться або "битий"
    if (!post || (!post.user && !post.space)) return null;

    // --- ЛОГІКА АВТОРСТВА (Юзер чи Група) ---
    const isSpacePost = post.is_posted_as_space && post.space;

    // Хто виступає обличчям поста
    const author = isSpacePost ? post.space : post.user;

    const isAvatarUpdate = post.is_avatar_update === true;
    const showTargetUser = !isAvatarUpdate && !isSpacePost && post.target_user && post.target_user.username !== currentProfileUsername;

    // isAuthor: чи поточний юзер є фізичним автором цього поста
    const isAuthor = currentUserId ? currentUserId == post.user?.id : false;

    // Дані для відображення
    const authorLink = isSpacePost ? `/${author.nickname}` : `/${author.username}`;
    const authorName = isSpacePost ? author.name : `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.username;
    const authorNameColor = isSpacePost ? undefined : author?.personalization?.username_color;

    // Фейковий об'єкт для компонента Avatar, щоб він міг відмалювати обкладинку групи
    const avatarData = isSpacePost ? {
        avatar: author.cover_url || author.avatar_path,
        username: author.nickname,
        first_name: author.name,
        last_name: ''
    } : author;

    // --- ПРАВА ДОСТУПУ ---
    const canEdit = onEdit && isAuthor && !isAvatarUpdate;
    // Автор поста АБО адмін групи/стіни (isOwner) можуть видаляти
    const canDelete = onDelete && (isAuthor || isOwner);
    const canReport = onReport && !isAuthor;

    const showActions = canEdit || canDelete || canReport;

    const avatarUpdateText = post.user?.gender === 2
        ? t('post.updated_avatar_female')
        : t('post.updated_avatar_male');

    return (
        <div className="tetrone-post-header">

            {/* БЛОК АВАТАРКИ */}
            <Link to={authorLink}>
                <Avatar
                    user={avatarData}
                    className="tetrone-post-avatar"
                />
            </Link>

            {/* БЛОК ТЕКСТУ ТА ДАТИ */}
            <div className="tetrone-post-meta">
                <div className="tetrone-post-authors-row">
                    <Link
                        to={authorLink}
                        className="tetrone-post-author"
                        style={authorNameColor ? { color: authorNameColor } : undefined}
                    >
                        {authorName}
                    </Link>

                    {/* Підказка для адмінів: якщо пост від імені групи, але ми бачимо справжнього юзера */}
                    {isSpacePost && post.user && (
                        <span className="tetrone-post-target-text" style={{ fontSize: '0.85em', color: '#8c8c8c', marginLeft: '6px' }}>
                            ({t('spaces.posted_by_admin', 'написав')} <Link to={`/${post.user.username}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{post.user.first_name}</Link>)
                        </span>
                    )}

                    {isAvatarUpdate && !isSpacePost && (
                        <span className="tetrone-post-target-text">
                            {' '}{avatarUpdateText}
                        </span>
                    )}

                    {showTargetUser && (
                        <span className="tetrone-post-target-text">
                            {' '}{t(`post.wrote_on_wall_${post.user?.gender === 2 ? 'female' : 'male'}`)}{' '}
                            <Link to={`/${post.target_user.username}`} className="tetrone-post-author target">
                                {post.target_user.first_name} {post.target_user.last_name}
                            </Link>
                        </span>
                    )}

                    {!isSpacePost && post.space_id && post.space && (
                        <span className="tetrone-post-target-text">
                            <span style={{ margin: '0 6px', color: '#8c8c8c', fontSize: '0.85em' }}>▶</span>
                            <Link to={`/${post.space.nickname}`} className="tetrone-post-author target">
                                {post.space.name}
                            </Link>
                        </span>
                    )}
                </div>

                <Link to={`/post/${post.id}`} className="tetrone-post-date">
                    {formatDate(post.created_at)}
                </Link>
            </div>

            {/* МЕНЮ ДІЙ */}
            {showActions && (
                <div className="tetrone-post-actions-container" style={{ position: 'relative', marginLeft: 'auto' }}>
                    <button
                        className="tetrone-post-action-btn-trigger"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <DotsIcon width={20} height={20} />
                    </button>

                    {showMenu && (
                        <div className="tetrone-actions-dropdown">
                            {canEdit && (
                                <button onClick={() => { onEdit(post); setShowMenu(false); }}>
                                    <EditIcon /> {t('action.edit')}
                                </button>
                            )}
                            {canDelete && (
                                <button className="danger" onClick={() => { onDelete(post.id); setShowMenu(false); }}>
                                    <DeleteIcon /> {t('action.delete')}
                                </button>
                            )}
                            {canReport && (
                                <button className="warning" onClick={() => { onReport(post.id); setShowMenu(false); }}>
                                    <ReportIcon /> {t('reports.title')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}