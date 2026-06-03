import { useTranslation } from 'react-i18next';
import { usePostActions } from "./hooks/usePostActions";

import PostHeader from "./PostHeader";
import PostContent from "./content/PostContent";
import PostFooter from "./PostFooter";
import ReportModal from "../modals/ReportModal";
import PostService from '../../services/post.service';
import { notifyError } from '../common/Notify';
import { triggerStickerConfetti } from '../../utils/confetti';

export default function PostItem({
    post,
    onEdit,
    onDelete,
    isOwner,
    currentUserId,
    onLikeToggle,
    onRepostSuccess,
    isInner = false,
    readonly = false,
    depth = 1
}) {
    const { t } = useTranslation();

    const {
        postData,
        isReposting,
        isReportModalOpen, setIsReportModalOpen,
        updateLocalPost,
        toggleLike,
        createRepost
    } = usePostActions(post, readonly, onLikeToggle, onRepostSuccess);

    const handleToggleReaction = async (stickerPayload, event) => {
        const currentReactions = postData.reactions || [];
        const previousReactions = [...currentReactions];

        const rawId = typeof stickerPayload === 'object' ? stickerPayload.id : stickerPayload;
        const stickerId = Number(rawId);
        const stickerUrl = typeof stickerPayload === 'object' ? stickerPayload.url : null;

        const existing = currentReactions.find(r => Number(r.id) === stickerId);
        const isAdding = !existing || !existing.me;

        let updated = currentReactions.map(r => {
            if (Number(r.id) === stickerId) {
                return { ...r, count: r.me ? r.count - 1 : r.count + 1, me: !r.me };
            }
            return r;
        }).filter(r => r.count > 0);

        if (!existing && stickerUrl) {
            updated.push({ id: stickerId, url: stickerUrl, count: 1, me: true });
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
            if (res.success) {
                updateLocalPost({ reactions: res.data });
            } else {
                updateLocalPost({ reactions: previousReactions });
                notifyError(res.message);
            }
        } catch (error) {
            updateLocalPost({ reactions: previousReactions });
            console.error(error);
        }
    };

    const originalAuthorColor = postData.original_post?.user?.personalization?.username_color;

    return (
        <div className={`tetrone-post ${isInner ? 'tetrone-post-inner' : ''} ${readonly ? 'tetrone-post-readonly' : ''}`}>
            <PostHeader
                post={postData}
                isOwner={isOwner}
                currentUserId={currentUserId}
                onEdit={!isInner && !readonly ? onEdit : null}
                onDelete={!isInner && !readonly ? onDelete : null}
                onReport={!isInner && !readonly ? () => setIsReportModalOpen(true) : null}
            />

            <PostContent
                content={postData.content}
                post={postData}
                onUpdate={updateLocalPost}
                isOwner={isOwner}
            />

            {postData.is_repost && (
                <div
                    className="tetrone-repost-branch"
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
                        <div className="tetrone-repost-limit-msg">{t('post.nested_too_deep')}</div>
                    ) : (
                        <div className="tetrone-deleted-stub">{t('post.original_deleted')}</div>
                    )}
                </div>
            )}

            {!isInner && (
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
}