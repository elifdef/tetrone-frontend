import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router";
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { EditIcon, DeleteIcon, ReplyIcon, ReportIcon, DotsIcon } from '../ui/Icons';
import RichText from '../common/RichText';
import Editor from '../editor/Editor';
import { isEditorEmpty } from '../../utils/editorHelpers';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import CommentForm from './CommentForm';
import CommentService from '../../services/comment.service';
import { notifyError } from '../common/Notify';
import { triggerStickerConfetti } from '../../utils/confetti';
import StickerPicker from '../editor/StickerPicker';
import LikeIcon from '../../assets/like.svg?react';
import NoLikeIcon from '../../assets/nolike.svg?react';
import ReportModal from '../modals/ReportModal';

export default function CommentItem({ comment, currentUser, onDelete, onEdit, onAddComment, depth = 1 })
{
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const location = useLocation();
    const commentRef = useRef(null);
    const queryClient = useQueryClient();

    const isOwner = currentUser && currentUser.username === comment.user.username;
    const canReport = currentUser && !isOwner;

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReplying, setIsReplying] = useState(false);

    const [showPicker, setShowPicker] = useState(false);
    const hideTimeout = useRef(null);

    const queryKey = ['comments', comment.post_id];

    useEffect(() =>
    {
        const params = new URLSearchParams(location.search);
        if (params.get('comment') === comment.id)
        {
            setIsHighlighted(true);
            commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const timer = setTimeout(() => setIsHighlighted(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [location.search, comment.id]);

    const handleSave = async () =>
    {
        if (isEditorEmpty(editContent) || JSON.stringify(editContent) === JSON.stringify(comment.content))
        {
            setIsEditing(false);
            return;
        }
        const success = await onEdit(comment.id, editContent);
        if (success)
        {
            setIsEditing(false);
        }
    };

    const handleInlineReplySubmit = async (content) =>
    {
        const targetParentId = depth >= 3 ? comment.parent_id : comment.id;
        const success = await onAddComment(content, targetParentId);
        if (success)
        {
            setIsReplying(false);
        }
        return success;
    };

    const handleReplyClick = () =>
    {
        const targetParentId = depth >= 3 ? comment.parent_id : comment.id;
        onReply(comment.user, targetParentId, depth);
    };

    const updateCache = (updater) =>
    {
        queryClient.setQueryData(queryKey, (oldData) =>
        {
            if (!oldData)
            {
                return oldData;
            }
            return {
                ...oldData,
                pages: oldData.pages.map(page => ({
                    ...page,
                    comments: page.comments.map(c => c.id === comment.id ? updater(c) : c)
                }))
            };
        });
    };

    const handleLike = async () =>
    {
        if (!currentUser)
        {
            return;
        }
        const originalLiked = comment.is_liked;
        const originalCount = comment.likes_count || 0;

        // Миттєве оновлення UI
        updateCache(c => ({
            ...c,
            is_liked: !originalLiked,
            likes_count: originalLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1
        }));

        try
        {
            const res = await CommentService.toggleLike(comment.id);
            if (!res || res.code !== 'COMMENT_LIKE_TOGGLED')
            {
                throw new Error();
            }
        } catch (err)
        {
            updateCache(c => ({ ...c, is_liked: originalLiked, likes_count: originalCount }));
            notifyError(t('api.errors.ERR_NETWORK'));
        }
    };

    const handleToggleReaction = async (stickerPayload, event) =>
    {
        if (!currentUser)
        {
            return;
        }
        const currentReactions = comment.reactions || [];
        const previousReactions = [...currentReactions];

        const rawId = typeof stickerPayload === 'object' ? stickerPayload.id : stickerPayload;
        const stickerId = Number(rawId);
        const stickerUrl = typeof stickerPayload === 'object' ? stickerPayload.url : null;

        const existing = currentReactions.find(r => Number(r.id) === stickerId);
        const isAdding = !existing || !existing.me;

        let updated = currentReactions.map(r =>
        {
            if (Number(r.id) === stickerId)
            {
                return { ...r, count: r.me ? r.count - 1 : r.count + 1, me: !r.me };
            }
            return r;
        }).filter(r => r.count > 0);

        if (!existing)
        {
            if (stickerUrl)
            {
                updated.push({ id: stickerId, url: stickerUrl, count: 1, me: true });
            }
            else
            {
                updated = previousReactions;
            }
        }

        updated.sort((a, b) => b.count - a.count);
        updateCache(c => ({ ...c, reactions: updated }));

        if (isAdding)
        {
            setTimeout(() =>
            {
                let spawnX = event?.clientX || window.innerWidth / 2;
                let spawnY = event?.clientY || window.innerHeight / 2;

                const container = document.getElementById(`comment-reactions-${ comment.id }`);
                if (container)
                {
                    const badge = container.querySelector(`[data-sticker-id="${ stickerId }"]`);
                    if (badge)
                    {
                        const rect = badge.getBoundingClientRect();
                        spawnX = rect.left + rect.width / 2;
                        spawnY = rect.top + rect.height / 2;
                    }
                }

                const urlToAnimate = existing ? existing.url : stickerUrl;
                if (urlToAnimate)
                {
                    triggerStickerConfetti(urlToAnimate, spawnX, spawnY);
                }
            }, 10);
        }

        try
        {
            const res = await CommentService.toggleReaction(comment.id, stickerId);
            if (res && res.code && res.code.startsWith('ERR_'))
            {
                updateCache(c => ({ ...c, reactions: previousReactions }));
                notifyError(t(`api.errors.${ res.code }`));
                return;
            }
            if (res && res.reactions)
            {
                updateCache(c => ({ ...c, reactions: res.reactions })); // Синхронізація з БД
            }
            else
            {
                updateCache(c => ({ ...c, reactions: previousReactions }));
                notifyError(t('api.errors.ERR_NETWORK'));
            }
        } catch (error)
        {
            updateCache(c => ({ ...c, reactions: previousReactions }));
            console.error(error);
        }
    };

    const hasChildren = comment.children && comment.children.length > 0;

    return (
        <div className={ `tetrone-comment-thread depth-${ depth }` }>
            <div ref={ commentRef }
                 className={ `tetrone-comment-item ${ isHighlighted ? 'tetrone-highlight-msg' : '' } ${ hasChildren ? 'has-children' : '' }` }>
                <div className="tetrone-comment-avatar-col">
                    <Link to={ `/${ comment.user.username }` }>
                        <Avatar user={ comment.user } className="tetrone-comment-avatar square-avatar"/>
                    </Link>
                </div>

                <div className="tetrone-comment-content">
                    <div className="tetrone-comment-header">
                        <Link to={ `/${ comment.user.username }` } className="tetrone-comment-author">
                            { comment.user.first_name } { comment.user.last_name }
                        </Link>
                        <span className="tetrone-comment-date">{ formatDate(comment.created_at) }</span>

                        { (isOwner || canReport) && !isEditing && (
                            <div className="tetrone-comment-more-actions" onClick={ () => setShowMenu(!showMenu) }>
                                <DotsIcon/>
                                { showMenu && (
                                    <div className="tetrone-actions-dropdown">
                                        { isOwner && (
                                            <>
                                                <button onClick={ () =>
                                                {
                                                    setIsEditing(true);
                                                    setShowMenu(false);
                                                } }><EditIcon/> { t('action.edit') }</button>
                                                <button className="danger" onClick={ () =>
                                                {
                                                    onDelete(comment.id);
                                                    setShowMenu(false);
                                                } }><DeleteIcon/> { t('action.delete') }</button>
                                            </>
                                        ) }
                                        { canReport && (
                                            <button className="warning" onClick={ () =>
                                            {
                                                setIsReportModalOpen(true);
                                                setShowMenu(false);
                                            } }><ReportIcon/> { t('reports.title') }</button>
                                        ) }
                                    </div>
                                ) }
                            </div>
                        ) }
                    </div>

                    <div className="tetrone-comment-body">
                        { isEditing ? (
                            <div className="tetrone-edit-mode-comment">
                                <Editor className="tetrone-edit-textarea" value={ editContent }
                                        onChange={ setEditContent }/>
                                <div className="tetrone-edit-buttons-right" style={ { marginTop: '5px' } }>
                                    <Button onClick={ handleSave }>{ t('action.save') }</Button>
                                    <Button variant='secondary'
                                            onClick={ () => setIsEditing(false) }>{ t('action.cancel') }</Button>
                                </div>
                            </div>
                        ) : (
                            <RichText text={ comment.content } className="tetrone-comment-text"/>
                        ) }
                    </div>

                    <div className="tetrone-comment-actions">
                        <div
                            className="tetrone-like-hover-wrapper"
                            onMouseEnter={ () =>
                            {
                                clearTimeout(hideTimeout.current);
                                setShowPicker(true);
                            } }
                            onMouseLeave={ () =>
                            {
                                hideTimeout.current = setTimeout(() => setShowPicker(false), 300);
                            } }
                        >
                            <button
                                className={ `tetrone-comment-like-btn ${ comment.is_liked ? 'liked' : '' }` }
                                onClick={ handleLike }
                                disabled={ !currentUser }
                                style={ comment.is_liked ? { color: '#e64646' } : {} }
                            >
                                { comment.is_liked ? <LikeIcon width={ 14 } height={ 14 }/> :
                                    <NoLikeIcon width={ 14 } height={ 14 }/> }
                                { comment.likes_count || 0 }
                            </button>

                            { showPicker && currentUser && (
                                <div className="tetrone-reaction-popover-mini"
                                     style={ { bottom: '100%', left: 0, top: 'auto' } }>
                                    <StickerPicker
                                        onSelect={ (sticker) =>
                                        {
                                            setShowPicker(false);
                                            handleToggleReaction(sticker);
                                        } }
                                    />
                                </div>
                            ) }
                        </div>

                        { !isEditing && currentUser && (
                            <button
                                className="tetrone-comment-reply-btn"
                                onClick={ () => setIsReplying(!isReplying) }
                            >
                                <ReplyIcon/> { t('action.comment', 'Відповісти') }
                            </button>
                        ) }

                        { comment.reactions && comment.reactions.length > 0 && (
                            <div
                                id={ `comment-reactions-${ comment.id }` }
                                className="tetrone-post-reactions-badges"
                            >
                                { comment.reactions.map((r) => (
                                    <button
                                        key={ r.id }
                                        data-sticker-id={ r.id }
                                        className={ `tetrone-reaction-badge ${ r.me ? 'active' : '' }` }
                                        onClick={ (e) => currentUser && handleToggleReaction(r.id, e) }
                                        disabled={ !currentUser }
                                    >
                                        <img src={ r.url } alt="reaction"/>
                                        <span className="reaction-count">{ r.count }</span>
                                    </button>
                                )) }
                            </div>
                        ) }
                    </div>

                    { isReplying && (
                        <div className="tetrone-inline-reply-container">
                            <CommentForm
                                user={ currentUser }
                                onSubmit={ handleInlineReplySubmit }
                                onCancel={ () => setIsReplying(false) }
                                placeholder={ `${ t('action.comment', 'Відповісти') } ${ comment.user.first_name }...` }
                            />
                        </div>
                    ) }
                </div>
            </div>

            { comment.children && comment.children.length > 0 && (
                <div className="tetrone-comment-children-container">
                    { comment.children.map(child => (
                        <CommentItem
                            key={ child.id }
                            comment={ child }
                            currentUser={ currentUser }
                            onDelete={ onDelete }
                            onEdit={ onEdit }
                            onAddComment={ onAddComment }
                            depth={ depth < 3 ? depth + 1 : 3 }
                        />
                    )) }
                </div>
            ) }

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="comment"
                targetId={comment.id}
            />
        </div>
    );
}