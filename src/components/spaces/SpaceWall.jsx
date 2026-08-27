import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SpaceService from '../../services/space.service';
import InfiniteScrollList from '../common/InfiniteScrollList';
import PostItem from '../post/PostItem';
import CreatePostForm from '../post/CreatePostForm';
import PostService from '../../services/post.service';
import { notifyError } from '../common/Notify';

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
            const res = await SpaceService.getSpacePosts(space.username, pageNum);

            if (res.code === 'SPACE_POSTS_RETRIEVED') {
                const newPosts = res.posts || [];
                setPosts(prev => pageNum === 1 ? newPosts : [...prev, ...newPosts]);

                const meta = res.posts?.meta;
                setHasMore(meta ? meta.current_page < meta.last_page : false);
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setIsLoadingInitial(false);
            setIsLoadingMore(false);
        }
    }, [space.username]);

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

    const handlePostCreated = async (payload, files) => {
        try {
            const cleanPayload = {};
            if (payload.text) cleanPayload.text = payload.text;
            if (payload.poll) cleanPayload.poll = payload.poll;
            if (payload.youtube) cleanPayload.youtube = payload.youtube;

            const res = await PostService.create({
                payload: Object.keys(cleanPayload).length > 0 ? cleanPayload : null,
                images: files,
                space_username: space.username,
                is_posted_as_space: payload.is_posted_as_space,
                published_at: payload.published_at
            });

            if (res && res.post) {
                setPosts(prev => [res.post, ...prev]);
                return true;
            }
            notifyError(t('error.server'));
            return false;
        } catch (error) {
            notifyError(t('error.network'));
            return false;
        }
    };

    const canPostAsSpace = ['owner', 'admin', 'moderator'].includes(space.member_role);

    return (
        <>
            {space.is_member && (
                <div className="mb-[15px]">
                    <CreatePostForm space={space} isSpaceAdmin={canPostAsSpace} onSubmitSuccess={handlePostCreated} />
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
                className="tetrone-feed-list flex flex-col gap-[10px]"
                emptyState={
                    <div className="p-[20px] text-center text-text-muted border border-border bg-bg-box">
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