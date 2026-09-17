import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePostActions } from "./hooks/usePostActions";

import PostHeader from "./PostHeader";
import PostContent from "./content/PostContent";
import PostFooter from "./PostFooter";
import ReportModal from "../modals/ReportModal";
import PostService from '../../services/post.service';
import { notifyError } from '../common/Notify';
import { triggerStickerConfetti } from '../../utils/confetti';

const PostItem = ({
    post, onEdit, onDelete, isOwner, currentUsername, onLikeToggle, onRepostSuccess,
    isInner = false, readonly = false, depth = 1, isAdmin = false,
    onPublishNow, onPinToggle
}) => {
    const { t } = useTranslation();

    const {
        postData, isReposting, isReportModalOpen, setIsReportModalOpen,
        updateLocalPost, toggleLike, createRepost
    } = usePostActions(post, readonly, onLikeToggle, onRepostSuccess);

    const isScheduled = postData.is_published === false;

    const handleToggleReaction = async (stickerPayload, event) => {
        if (readonly && !isAdmin) return;

        const currentReactions = postData.reactions || [];
        const previousReactions = [...currentReactions];

        const rawId = typeof stickerPayload === 'object' ? stickerPayload.id : stickerPayload;
        const stickerId = Number(rawId);
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
        updateLocalPost({ reactions: updated });

        if (isAdding) {
            setTimeout(() => {
                let spawnX = event?.clientX || window.innerWidth / 2;
                let spawnY = event?.clientY || window.innerHeight / 2;

                const container = document.getElementById(`post-reactions-${postData.id}`);
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
            const res = await PostService.toggleReaction(postData.id, stickerId);
            if (res && res.code && res.code.startsWith('ERR_')) {
                updateLocalPost({ reactions: previousReactions });
                notifyError(t(`api.errors.${res.code}`));
                return;
            }
            if (res) updateLocalPost({ reactions: res.reactions || (res.post ? res.post.reactions : []) });
            else { updateLocalPost({ reactions: previousReactions }); notifyError(t('api.errors.ERR_NETWORK')); }
        } catch (error) {
            updateLocalPost({ reactions: previousReactions });
            console.error(error);
        }
    };

    const originalAuthorColor = postData.original_post?.user?.personalization?.username_color;

    const baseClasses = isInner ? 'mt-[12px] ml-[16px] pl-[16px] border-l-[2px] border-border' : 'mt-[10px] first:border-t-0 first:pt-[5px] max-md:mx-[-10px] max-md:border-x-0';
    const scheduledClasses = isScheduled ? 'opacity-70 bg-bg-page border border-dashed border-theme-warning/40 p-[10px]' : '';

    const pinnedClasses = postData.is_pinned && !isInner ? 'bg-[rgba(0,102,204,0.02)] border-[2px] border-theme-link/30 rounded-[4px] p-[10px_10px_0_10px] shadow-sm relative overflow-hidden mb-[15px]' : '';

    return (
        <div className={`${baseClasses} ${scheduledClasses} ${pinnedClasses}`}>
            {postData.is_pinned && !isInner && (
                <div className="absolute top-0 left-0 w-[4px] h-full bg-theme-link"></div>
            )}

            {isScheduled && (
                <div className="bg-[rgba(255,153,0,0.1)] border border-[rgba(255,153,0,0.3)] text-[#ff9900] text-[11px] px-[10px] py-[6px] mb-[5px]">
                    {t('post.will_be_published')}: <strong>{postData.published_at}</strong>
                </div>
            )}

            <PostHeader
                post={postData}
                isOwner={isOwner}
                currentUsername={currentUsername}
                onEdit={onEdit}
                onDelete={onDelete}
                onReport={!isInner && !readonly && !isScheduled ? () => setIsReportModalOpen(true) : null}
                readonly={readonly}
                isAdmin={isAdmin}
                onPublishNow={onPublishNow}
                onPinToggle={onPinToggle}
            />

            <div className={`text-[11px] leading-[1.4] pl-[60px] mt-[5px] mb-[5px] max-md:pl-[10px] max-md:mt-[10px] post-text ${isScheduled ? 'pointer-events-none' : ''}`}>
                <PostContent
                    content={postData.content}
                    post={postData}
                    onUpdate={updateLocalPost}
                    isOwner={isOwner}
                />
            </div>

            {postData.is_repost && (
                <div
                    className="mt-[12px] p-[12px] border border-border bg-[rgba(128,128,128,0.05)]"
                    style={originalAuthorColor ? { borderLeftColor: originalAuthorColor } : {}}
                >
                    {postData.original_post_id && postData.original_post && depth < 3 ? (
                        <PostItem
                            post={postData.original_post}
                            isInner={true}
                            readonly={true}
                            depth={depth + 1}
                        />
                    ) : postData.original_post_id && depth >= 3 ? (
                        <div className="p-[12px] bg-bg-page text-text-muted italic text-[11px] text-center mt-[10px]">{t('post.nested_too_deep')}</div>
                    ) : (
                        <div className="p-[15px] mt-[10px] bg-bg-page text-text-muted text-[13px] text-center italic">{t('post.original_deleted')}</div>
                    )}
                </div>
            )}

            {!isInner && !isScheduled && (
                <PostFooter
                    postId={postData.id}
                    isLiked={postData.is_liked}
                    likesCount={postData.likes_count}
                    commentsCount={postData.comments_count}
                    repostsCount={postData.reposts_count}
                    onToggleReaction={handleToggleReaction}
                    reactions={postData.reactions}
                    onLike={toggleLike}
                    onRepost={createRepost}
                    isReposting={isReposting}
                    readonly={readonly}
                />
            )}

            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} targetType="post" targetId={postData.id} />
        </div>
    );
};

export default memo(PostItem, (prevProps, nextProps) => {
    if (prevProps.post.id !== nextProps.post.id) return false;
    if (prevProps.post.likes_count !== nextProps.post.likes_count) return false;
    if (prevProps.post.comments_count !== nextProps.post.comments_count) return false;
    if (prevProps.post.reposts_count !== nextProps.post.reposts_count) return false;
    if (prevProps.post.is_liked !== nextProps.post.is_liked) return false;
    if (prevProps.post.is_published !== nextProps.post.is_published) return false;
    if (prevProps.post.is_pinned !== nextProps.post.is_pinned) return false;
    if (JSON.stringify(prevProps.post.reactions) !== JSON.stringify(nextProps.post.reactions)) return false;
    if (JSON.stringify(prevProps.post.content) !== JSON.stringify(nextProps.post.content)) return false;
    return true;
});