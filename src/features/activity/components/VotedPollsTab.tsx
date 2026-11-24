import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '@/services/activity.service';
import PostItem from '@/components/post/PostItem';
import InfiniteScrollList from '@/components/common/InfiniteScrollList';
import type { SpacePost } from '@/types/space';

export default function VotedPollsTab() {
    const { t } = useTranslation();

    const [posts, setPosts] = useState<SpacePost[]>([]);
    const [request, setRequest] = useState({ page: 1, reloadKey: 0 });
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        ActivityService.getVotedPolls(request.page)
            .onSuccess((res) => {
                if (cancelled) return;
                const items = Array.isArray(res.posts) ? res.posts : [];
                const meta = res.meta;

                setPosts((prev) => {
                    if (request.page === 1) return items;
                    const existingIds = new Set(prev.map((p) => p.id));
                    const uniqueNewPosts = items.filter((p) => !existingIds.has(p.id));
                    return [...prev, ...uniqueNewPosts];
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

    return (
        <InfiniteScrollList
            itemsCount={posts.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={handleRetry}
            className="flex flex-col gap-[10px]"
            emptyState={
                <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px] italic rounded-[2px]">
                    {t('empty.polls_voted')}
                </div>
            }
        >
            {posts.map((post, index) => (
                <div
                    key={post.id || `poll-${index}`}
                    className="bg-bg-box border border-border p-[15px] rounded-[2px]"
                >
                    <PostItem post={post} readonly={true} />
                </div>
            ))}
        </InfiniteScrollList>
    );
}