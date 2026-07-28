import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SpaceService from '../../services/space.service';
import InfiniteScrollList from '../common/InfiniteScrollList';
import PostItem from '../post/PostItem';
import CreatePostForm from '../post/CreatePostForm';
import PostService from '../../services/post.service';

const SpaceWall = ({ space }) => {
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchPosts = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        try {
            const res = await SpaceService.getSpacePosts(space.nickname, pageNum);
            if (res.success) {
                const newPosts = res.data || [];
                setPosts(prev => pageNum === 1 ? newPosts : [...prev, ...newPosts]);
                setHasMore(res.meta ? res.meta.current_page < res.meta.last_page : false);
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setIsLoadingInitial(false);
            setIsLoadingMore(false);
        }
    }, [space.nickname]);

    useEffect(() => {
        fetchPosts(1);
    }, [fetchPosts]);

    const loadMore = () => {
        if (!isLoadingMore && hasMore && !error) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(nextPage);
        }
    };

    // У SpaceWall.jsx
    const handlePostCreated = async (payload, files) => {
        try {
            const res = await PostService.create({
                payload: payload,
                images: files,
                space_id: space.id,
                is_posted_as_space: payload.is_posted_as_space
            });

            if (res) {
                setPosts(prev => [res.post, ...prev]);
                return true;
            }
            notifyError(t('api.error.ERR_SERVER'));
            return false;
        } catch (error) {
            notifyError(t('api.error.ERR_NETWORK'));
            return false;
        }
    };

    const canPostAsSpace = ['owner', 'admin', 'moderator'].includes(space.member_role);

    return (
        <>
            {space.is_member && (
                <div style={{ marginBottom: '15px' }}>
                    <CreatePostForm
                        spaceId={space.id}
                        canPostAsSpace={canPostAsSpace}
                        onSubmitSuccess={handlePostCreated}
                    />
                </div>
            )}

            <InfiniteScrollList
                itemsCount={posts.length}
                isLoadingInitial={isLoadingInitial}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                error={error}
                onRetry={() => fetchPosts(1)}
                className="tetrone-feed-list"
                emptyState={
                    <div className="space-block-content text-center">
                        {t('spaces.wall_empty')}
                    </div>
                }
            >
                {posts.map(post => (
                    <PostItem key={post.id} post={post} />
                ))}
            </InfiniteScrollList>
        </>
    );
};

export default SpaceWall;