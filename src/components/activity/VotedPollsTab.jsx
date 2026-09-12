import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '../../services/activity.service';
import PostItem from '../post/PostItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { notifyError } from '../common/Notify';

export default function VotedPollsTab() {
    const { t } = useTranslation();

    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchPolls = useCallback(() => {
        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        ActivityService.getVotedPolls(page)
        .onSuccess((res) => {
            const items = res.posts || [];
            const meta = res.meta;

            setPosts(prev => {
                if (page === 1) return items;
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPosts = items.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewPosts];
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
        fetchPolls();
    }, [fetchPolls]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleUpdatePost = (updatedPost) => {
        setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    return (
        <InfiniteScrollList
            itemsCount={posts.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={fetchPolls}
            className="flex flex-col gap-[10px]"
            emptyState={
                <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px] italic rounded-[2px]">
                    {t('empty.polls_voted')}
                </div>
            }
        >
            {posts.map((post, index) => (
                <div key={post.id || `poll-${index}`} className="bg-bg-box border border-border p-[15px] rounded-[2px]">
                    <PostItem
                        post={post}
                        onUpdate={handleUpdatePost}
                        readonly={true}
                    />
                </div>
            ))}
        </InfiniteScrollList>
    );
}