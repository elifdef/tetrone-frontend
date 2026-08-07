import { useState, useEffect, memo } from 'react';
import { Link, useParams } from "react-router";
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { EditIcon, DeleteIcon, ReportIcon, DotsIcon } from '../ui/Icons';
import Avatar from '../ui/Avatar';

const PostHeader = ({ post, isOwner, onEdit, onDelete, onReport, currentUsername }) => {
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

    if (!post || (!post.user && !post.space)) return null;

    const isSpacePost = post.is_posted_as_space && post.space;
    const isSpaceContext = !post.is_posted_as_space && post.space;

    const author = isSpacePost ? post.space : post.user;
    const isAvatarUpdate = post.is_avatar_update === true;
    const showTargetUser = !isAvatarUpdate && !isSpacePost && !isSpaceContext && post.target_user && post.target_user.username !== currentProfileUsername;

    // 2. ВИПРАВЛЕНО: Тепер перевіряємо власника виключно по username
    const isAuthor = currentUsername ? currentUsername === post.user?.username : false;

    const authorLink = isSpacePost ? `/space/${author.username}` : `/${author.username}`;
    const authorName = isSpacePost ? author.name : `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.username;

    const authorNameColor = isSpacePost ? undefined : author?.personalization?.username_color;

    const avatarData = isSpacePost ? {
        avatar: author.avatar_url || author.avatar_path || '/images/default-space.svg',
        username: author.username,
        aliases: author.aliases || [],
        first_name: author.name,
        last_name: ''
    } : author;

    const canEdit = onEdit && isAuthor && !isAvatarUpdate;
    const canDelete = onDelete && (isAuthor || isOwner);
    const canReport = onReport && !isAuthor;

    const showActions = canEdit || canDelete || canReport;

    const avatarUpdateText = post.user?.gender === 2
        ? t('post.updated_avatar_female')
        : t('post.updated_avatar_male');

    return (
        <div className="tetrone-post-header">
            <Link to={authorLink}>
                <Avatar
                    user={avatarData}
                    className="tetrone-post-avatar"
                />
            </Link>

            <div className="tetrone-post-meta">
                <div className="tetrone-post-authors-row">
                    <Link
                        to={authorLink}
                        className="tetrone-post-author"
                        style={authorNameColor ? { color: authorNameColor } : undefined}
                    >
                        {authorName}
                    </Link>

                    {isSpacePost && post.user && (
                        <span className="tetrone-post-admin-hint">
                            ({t('spaces.posted_by_admin')} <Link to={`/${post.user.username}`} className="tetrone-post-admin-link">{post.user.first_name}</Link>)
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

                    {isSpaceContext && (
                        <span className="tetrone-post-target-text">
                            <span className="tetrone-post-arrow">▶</span>
                            <Link to={`/space/${post.space.username}`} className="tetrone-post-author target">
                                {post.space.name}
                            </Link>
                        </span>
                    )}
                </div>

                <Link to={`/post/${post.id}`} className="tetrone-post-date">
                    {formatDate(post.created_at)}
                </Link>
            </div>

            {showActions && (
                <div className="tetrone-post-actions-container">
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
};

export default memo(PostHeader, (prev, next) => prev.post.id === next.post.id);