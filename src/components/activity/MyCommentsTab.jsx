import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '../../services/activity.service';
import CommentService from '../../services/comment.service';
import ActivityCommentItem from './ActivityCommentItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { notifyError } from '../common/Notify';
import { useModal } from '../../context/ModalContext';

export default function MyCommentsTab({ onCountUpdate }) {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchComments = useCallback(() => {
        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        ActivityService.getMyComments(page)
        .onSuccess((res) => {
            const items = res.comments || [];
            const meta = res.meta;

            setComments(prev => {
                if (page === 1) return items;
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNewComments = items.filter(c => !existingIds.has(c.id));
                return [...prev, ...uniqueNewComments];
            });

            setHasMore(meta ? meta.current_page < meta.last_page : false);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setError(true);
        })
        .onFinally(() => {
            setIsLoadingInitial(false);
            setIsLoadingMore(false);
        });
    }, [page, t]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleDeleteComment = async (commentId) => {
        const isConfirmed = await openConfirm(t('action.delete'));
        if (!isConfirmed) return;

        CommentService.delete(commentId)
        .onSuccess(() => {
            setComments(prev => prev.filter(c => c.uid !== commentId));
            if (onCountUpdate) onCountUpdate(-1);
        })
        .onError((err) => {
            // Витягуємо точну помилку сервера
            notifyError(t(`api.error.${err.code || 'ERR_DELETE_PERMISSION_DENIED'}`));
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
            onRetry={fetchComments}
            className="flex flex-col"
            emptyState={
                <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px] italic rounded-[2px]">
                    {t('empty.comments')}
                </div>
            }
        >
            {comments.map((comment, index) => (
                <ActivityCommentItem
                    key={comment.uid ? `comment-${comment.uid}` : `fallback-${index}`}
                    comment={comment}
                    onDelete={() => handleDeleteComment(comment.uid)}
                />
            ))}
        </InfiniteScrollList>
    );
}