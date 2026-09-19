import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router";
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { EditIcon, DeleteIcon, ReplyIcon, ReportIcon, DotsIcon, LikeIcon } from '../ui/Icons';
import RichText from '../common/RichText';
import SmartEditor from '../editor/SmartEditor';
import { isEditorEmpty } from '../../utils/editorHelpers';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import CommentForm from './CommentForm';
import CommentService from '../../services/comment.service';
import { notifyError } from '../common/Notify';
import { triggerStickerConfetti } from '../../utils/confetti';
import StickerPicker from '../editor/StickerPicker';
import ReportModal from '../modals/ReportModal';

export default function CommentItem({ comment, currentUser, onDelete, onEdit, onAddComment, depth = 1 }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const location = useLocation();
    const commentRef = useRef(null);
    const queryClient = useQueryClient();

    const isOwner = currentUser && currentUser.username === comment.user.username;
    const canReport = currentUser && !isOwner;

    const isEdited = comment.updated_at && comment.updated_at !== comment.created_at;

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReplying, setIsReplying] = useState(false);

    const [showPicker, setShowPicker] = useState(false);
    const hideTimeout = useRef(null);
    const menuRef = useRef(null);

    const queryKey = ['comments', comment.post_id];

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('comment') === comment.id) {
            setIsHighlighted(true);
            commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const timer = setTimeout(() => setIsHighlighted(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [location.search, comment.id]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleSave = async () => {
        if (isEditorEmpty(editContent) || JSON.stringify(editContent) === JSON.stringify(comment.content)) {
            setIsEditing(false);
            return;
        }
        const success = await onEdit(comment.id, editContent);
        if (success) setIsEditing(false);
    };

    const handleInlineReplySubmit = async (content) => {
        const targetParentId = depth >= 3 ? comment.parent_id : comment.id;
        const success = await onAddComment(content, targetParentId);
        if (success) setIsReplying(false);
        return success;
    };

    const updateCache = (updater) => {
        queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                pages: oldData.pages.map(page => ({
                    ...page,
                    comments: page.comments.map(c => c.id === comment.id ? updater(c) : c)
                }))
            };
        });
    };

    const handleLike = async () => {
        if (!currentUser) return;
        const originalLiked = comment.is_liked;
        const originalCount = comment.likes_count || 0;

        updateCache(c => ({
            ...c,
            is_liked: !originalLiked,
            likes_count: originalLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1
        }));

        try {
            const res = await CommentService.toggleLike(comment.id);
            if (!res || res.code !== 'COMMENT_LIKE_TOGGLED') throw new Error();
        } catch (err) {
            updateCache(c => ({ ...c, is_liked: originalLiked, likes_count: originalCount }));
            notifyError(t('api.errors.ERR_NETWORK'));
        }
    };

    const handleToggleReaction = async (stickerPayload, event) => {
        if (!currentUser) return;
        const currentReactions = comment.reactions || [];
        const previousReactions = [...currentReactions];

        const stickerId = Number(typeof stickerPayload === 'object' ? stickerPayload.id : stickerPayload);
        const stickerUrl = typeof stickerPayload === 'object' ? stickerPayload.url : null;

        const existing = currentReactions.find(r => Number(r.id) === stickerId);
        const isAdding = !existing || !existing.me;

        let updated = currentReactions.map(r => {
            if (Number(r.id) === stickerId) return { ...r, count: r.me ? r.count - 1 : r.count + 1, me: !r.me };
            return r;
        }).filter(r => r.count > 0);

        if (!existing) {
            if (stickerUrl) updated.push({ id: stickerId, url: stickerUrl, count: 1, me: true });
            else updated = previousReactions;
        }

        updated.sort((a, b) => b.count - a.count);
        updateCache(c => ({ ...c, reactions: updated }));

        if (isAdding) {
            setTimeout(() => {
                let spawnX = event?.clientX || window.innerWidth / 2;
                let spawnY = event?.clientY || window.innerHeight / 2;
                const container = document.getElementById(`comment-reactions-${comment.id}`);
                if (container) {
                    const badge = container.querySelector(`[data-sticker-id="${stickerId}"]`);
                    if (badge) {
                        const rect = badge.getBoundingClientRect();
                        spawnX = rect.left + rect.width / 2;
                        spawnY = rect.top + rect.height / 2;
                    }
                }
                const urlToAnimate = existing ? existing.url : stickerUrl;
                if (urlToAnimate) triggerStickerConfetti(urlToAnimate, spawnX, spawnY);
            }, 10);
        }

        try {
            const res = await CommentService.toggleReaction(comment.id, stickerId);
            if (res?.code?.startsWith('ERR_')) {
                updateCache(c => ({ ...c, reactions: previousReactions }));
                notifyError(t(`api.errors.${res.code}`));
                return;
            }
            if (res?.reactions) updateCache(c => ({ ...c, reactions: res.reactions }));
            else throw new Error();
        } catch (error) {
            updateCache(c => ({ ...c, reactions: previousReactions }));
        }
    };

    const hasChildren = comment.children && comment.children.length > 0;
    const avatarSizeClass = depth === 1 ? 'w-[40px] h-[40px]' : 'w-[32px] h-[32px]';
    const dropItemClass = "bg-transparent border-none py-[6px] px-[12px] flex items-center gap-[6px] text-left cursor-pointer transition-colors whitespace-nowrap text-[11px] w-full outline-none text-text-main hover:bg-bg-page hover:text-theme-link";

    const usernameColor = comment.user.personalization?.username_color;

    return (
        <div className={`comment-thread depth-${depth}`}>
            <div ref={commentRef} className={`comment-item ${isHighlighted ? 'bg-[rgba(128,128,128,0.1)] transition-colors' : ''} ${hasChildren ? 'has-children' : ''}`}>

                <div className="flex-shrink-0 mr-[8px]">
                    <Link to={`/${comment.user.username}`}>
                        <Avatar user={comment.user} className={`${avatarSizeClass} border border-border object-cover rounded-none block`} />
                    </Link>
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center gap-[8px] mb-[4px] min-h-[16px]">
                        <Link 
                            to={`/${comment.user.username}`} 
                            className="text-theme-link font-bold text-[11px] no-underline hover:underline"
                            style={usernameColor ? { color: usernameColor } : undefined}
                        >
                            {comment.user.first_name} {comment.user.last_name}
                        </Link>
                        
                        <span className="text-[10px] text-text-muted">
                            {formatDate(comment.created_at)}
                            {isEdited && (
                                <span className="italic ml-[4px]">
                                    ({t('common.edited')} {formatDate(comment.updated_at)})
                                </span>
                            )}
                        </span>

                        {(isOwner || canReport) && !isEditing && (
                            <div className="relative ml-auto px-[4px] cursor-pointer text-text-muted hover:text-text-main flex items-center" ref={menuRef}>
                                <button type="button" className="bg-transparent border-none p-0 cursor-pointer text-inherit outline-none" onClick={() => setShowMenu(!showMenu)}>
                                    <DotsIcon />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-[4px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex flex-col min-w-[120px] py-[4px] z-[100]">
                                        {isOwner && (
                                            <>
                                                <button type="button" className={dropItemClass} onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                                                    <EditIcon width={14} height={14} /> {t('action.edit')}
                                                </button>
                                                <button type="button" className={`${dropItemClass} !text-theme-error hover:!text-theme-error`} onClick={() => { onDelete(comment.id); setShowMenu(false); }}>
                                                    <DeleteIcon width={14} height={14} /> {t('action.delete')}
                                                </button>
                                            </>
                                        )}
                                        {canReport && (
                                            <button type="button" className={`${dropItemClass} !text-theme-error hover:!text-theme-error`} onClick={() => { setIsReportModalOpen(true); setShowMenu(false); }}>
                                                <ReportIcon width={14} height={14} /> {t('reports.title')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="text-[12px] leading-[1.3] mb-[6px] text-text-main">
                        {isEditing ? (
                            <div className="flex flex-col">
                                <SmartEditor
                                    preset="comment"
                                    value={editContent}
                                    onChange={setEditContent}
                                />
                                <div className="flex justify-end gap-[5px] mt-[5px]">
                                    <Button onClick={handleSave}>{t('action.save')}</Button>
                                    <Button variant='secondary' onClick={() => setIsEditing(false)}>{t('action.cancel')}</Button>
                                </div>
                            </div>
                        ) : (
                            <RichText text={comment.content} className="comment-text" />
                        )}
                    </div>

                    <div className="flex items-center gap-[12px]">
                        <div
                            className="relative flex items-center"
                            onMouseEnter={() => { clearTimeout(hideTimeout.current); setShowPicker(true); }}
                            onMouseLeave={() => { hideTimeout.current = setTimeout(() => setShowPicker(false), 300); }}
                        >
                            <button
                                type="button"
                                className={`bg-transparent border-none text-[11px] font-bold flex items-center gap-[4px] p-0 cursor-pointer outline-none transition-colors ${comment.is_liked ? 'text-theme-error' : 'text-text-muted hover:text-theme-error'}`}
                                onClick={handleLike}
                                disabled={!currentUser}
                            >
                                <LikeIcon width={14} height={14} className={comment.is_liked ? 'fill-current' : ''} />
                                {comment.likes_count || 0}
                            </button>

                            {showPicker && currentUser && (
                                <div className="absolute bottom-full left-0 mb-[5px] w-[146px] h-[190px] bg-bg-box border border-border shadow-[0_4px_16px_rgba(0,0,0,0.3)] z-[9999] overflow-hidden animate-[tetronePopoverFadeInUp_0.15s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                                    <div className="[&_.w-\[280px\]]:!w-full [&_.w-\[280px\]]:!h-full [&_.w-\[280px\]]:!border-none [&_.w-\[280px\]]:!shadow-none [&_.w-\[280px\]]:!bg-transparent">
                                        <StickerPicker
                                            packs={[]}
                                            favorites={[]}
                                            isLoading={false}
                                            searchQuery=""
                                            onSearchChange={() => {}}
                                            onSelect={(sticker) => { setShowPicker(false); handleToggleReaction(sticker); }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isEditing && currentUser && (
                            <button type="button" className="bg-transparent border-none text-text-muted text-[11px] flex items-center gap-[4px] p-0 cursor-pointer hover:underline outline-none" onClick={() => setIsReplying(!isReplying)}>
                                <ReplyIcon width={14} height={14} /> {t('action.comment', 'Відповісти')}
                            </button>
                        )}

                        {comment.reactions && comment.reactions.length > 0 && (
                            <div id={`comment-reactions-${comment.id}`} className="flex flex-wrap items-center gap-[4px] m-0 p-0 ml-auto">
                                {comment.reactions.map((r) => (
                                    <button
                                        key={r.id}
                                        data-sticker-id={r.id}
                                        className={`inline-flex items-center gap-[4px] px-[6px] h-[20px] bg-bg-page border border-border transition-colors outline-none text-[10px] font-bold ${r.me ? '!bg-theme-header-bg !border-theme-link text-theme-link' : 'text-text-muted hover:bg-border'} ${!currentUser ? 'cursor-default' : 'cursor-pointer'}`}
                                        onClick={(e) => currentUser && handleToggleReaction(r.id, e)}
                                        disabled={!currentUser}
                                    >
                                        <img src={r.url} alt="reaction" className="w-[12px] h-[12px] object-contain" />
                                        <span>{r.count}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {isReplying && (
                        <div className="mt-[10px] pt-[10px] border-t border-border">
                            <CommentForm
                                user={currentUser}
                                onSubmit={handleInlineReplySubmit}
                                onCancel={() => setIsReplying(false)}
                                placeholder={`${t('action.comment', 'Відповісти')} ${comment.user.first_name}...`}
                            />
                        </div>
                    )}
                </div>
            </div>

            {hasChildren && (
                <div className="comment-children">
                    {comment.children.map(child => (
                        <CommentItem
                            key={child.id}
                            comment={child}
                            currentUser={currentUser}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onAddComment={onAddComment}
                            depth={depth < 3 ? depth + 1 : 3}
                        />
                    ))}
                </div>
            )}

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="comment"
                targetId={comment.id}
            />
        </div>
    );
}