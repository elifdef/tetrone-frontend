import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '@/services/activity.service';
import CommentService from '@/services/comment.service';
import ActivityCommentItem from './ActivityCommentItem';
import InfiniteScrollList from '@/components/common/InfiniteScrollList';
import { useModal } from '@/app/providers/modal-context';
import type { ActivityComment } from '@/types/activity';

export interface MyCommentsTabProps {
    onCountUpdate?: (delta: number) => void;
}

export default function MyCommentsTab({ onCountUpdate }: MyCommentsTabProps) {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [comments, setComments] = useState<ActivityComment[]>([]);
    const [request, setRequest] = useState({ page: 1, reloadKey: 0 });
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        ActivityService.getMyComments(request.page)
            .onSuccess((res) => {
                if (cancelled) return;
                const items = Array.isArray(res.comments) ? res.comments : [];
                const meta = res.meta;

                setComments((prev) => {
                    if (request.page === 1) return items;
                    const existingIds = new Set(prev.map((c) => c.id));
                    const uniqueNewComments = items.filter((c) => !existingIds.has(c.id));
                    return [...prev, ...uniqueNewComments];
                });

                setHasMore(meta ? meta.current_page < meta.last_page : false);
            })
            .onError(() => {
                if (!cancelled) {
                    setError(true);
                }
            })
            .onFinally(() => {
                if (!cancelled) {
                    setIsLoadingInitial(false);
                    setIsLoadingMore(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [request]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setIsLoadingMore(true);
            setRequest((prev) => ({ ...prev, page: prev.page + 1 }));
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleRetry = useCallback(() => {
        if (request.page === 1) {
            setIsLoadingInitial(true);
        } else {
            setIsLoadingMore(true);
        }
        setError(false);
        setRequest((prev) => ({ ...prev, reloadKey: prev.reloadKey + 1 }));
    }, [request.page]);

    const handleDeleteComment = async (commentId: string) => {
        const isConfirmed = await openConfirm(t('action.delete'));
        if (!isConfirmed) return;

        CommentService.delete(commentId).onSuccess(() => {
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            onCountUpdate?.(-1);
        });
    };

    return (
        <InfiniteScrollList
            itemsCount={comments.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={handleRetry}
            className="flex flex-col"
            emptyState={
                <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px] italic rounded-[2px]">
                    {t('empty.comments')}
                </div>
            }
        >
            {comments.map((comment, index) => (
                <ActivityCommentItem
                    key={comment.id ? `comment-${comment.id}` : `fallback-${index}`}
                    comment={comment}
                    onDelete={() => void handleDeleteComment(comment.id)}
                />
            ))}
        </InfiniteScrollList>
    );
}