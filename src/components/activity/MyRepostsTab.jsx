import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '../../services/activity.service';
import fetchClient from '../../api/client';
import PostItem from '../post/PostItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { notifyError } from '../common/Notify';
import { useModal } from '../../context/ModalContext';

export default function MyRepostsTab({ onCountUpdate }) {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [reposts, setReposts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchReposts = useCallback(() => {
        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        ActivityService.getMyReposts(page)
        .onSuccess((res) => {
            const newReposts = res.posts || [];
            const meta = res.meta;

            setReposts(prev => {
                if (page === 1) return newReposts;
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newReposts.filter(newItem => !existingIds.has(newItem.id));
                return [...prev, ...uniqueNew];
            });

            setHasMore(meta ? meta.current_page < meta.last_page : false);
        })
        .onError((err) => {
            notifyError(err.message || t('error.load_failed'));
            setError(true);
        })
        .onFinally(() => {
            setIsLoadingInitial(false);
            setIsLoadingMore(false);
        });
    }, [page, t]);

    useEffect(() => {
        fetchReposts();
    }, [fetchReposts]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleDelete = async (postId) => {
        const isConfirmed = await openConfirm(t('action.delete'));
        if (!isConfirmed) return;

        fetchClient(`/posts/${postId}`, { method: 'DELETE' })
        .onSuccess(() => {
            setReposts(prev => prev.filter(p => p.id !== postId));
            if (onCountUpdate) onCountUpdate(-1);
        })
        .onError((err) => {
            notifyError(err.message || t('error.delete_failed'));
        });
    };

    return (
        <InfiniteScrollList
            itemsCount={reposts.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={fetchReposts}
            className="flex flex-col gap-[10px]"
            emptyState={
                <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px] italic rounded-[2px]">
                    {t('empty.reposts')}
                </div>
            }
        >
            {reposts.map(post => (
                <div key={post.id} className="bg-bg-box border border-border p-[15px] rounded-[2px]">
                    <PostItem
                        post={post}
                        isOwner={true}
                        onDelete={handleDelete}
                    />
                </div>
            ))}
        </InfiniteScrollList>
    );
}