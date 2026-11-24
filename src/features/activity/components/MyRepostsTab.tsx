import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '@/services/activity.service';
import PostService from '@/services/post.service';
import PostItem from '@/components/post/PostItem';
import InfiniteScrollList from '@/components/common/InfiniteScrollList';
import { useModal } from '@/app/providers/modal-context';
import type { SpacePost } from '@/types/space';

export interface MyRepostsTabProps {
    onCountUpdate?: (delta: number) => void;
}

export default function MyRepostsTab({ onCountUpdate }: MyRepostsTabProps) {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [reposts, setReposts] = useState<SpacePost[]>([]);
    const [request, setRequest] = useState({ page: 1, reloadKey: 0 });
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        ActivityService.getMyReposts(request.page)
            .onSuccess((res) => {
                if (cancelled) return;
                const newReposts = Array.isArray(res.posts) ? res.posts : [];
                const meta = res.meta;

                setReposts((prev) => {
                    if (request.page === 1) return newReposts;
                    const existingIds = new Set(prev.map((p) => p.id));
                    const uniqueNew = newReposts.filter((newItem) => !existingIds.has(newItem.id));
                    return [...prev, ...uniqueNew];
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

    const handleDelete = async (postId: number | string) => {
        const isConfirmed = await openConfirm(t('action.delete'));
        if (!isConfirmed) return;

        PostService.delete(postId).onSuccess(() => {
            setReposts((prev) => prev.filter((p) => p.id !== postId));
            onCountUpdate?.(-1);
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
            onRetry={handleRetry}
            className="flex flex-col gap-[10px]"
            emptyState={
                <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px] italic rounded-[2px]">
                    {t('empty.reposts')}
                </div>
            }
        >
            {reposts.map((post) => (
                <div key={post.id} className="bg-bg-box border border-border p-[15px] rounded-[2px]">
                    <PostItem
                        post={post}
                        isOwner={true}
                        onDelete={(id) => void handleDelete(id)}
                    />
                </div>
            ))}
        </InfiniteScrollList>
    );
}