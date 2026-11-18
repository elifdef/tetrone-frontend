import { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import { SpaceContext } from '@/context/SpaceContext';
import SpaceService from '@/services/space.service';
import InfiniteScrollList from '@/components/common/InfiniteScrollList';
import PostItem from '@/components/post/PostItem';
import CreatePostForm from '@/components/post/CreatePostForm';
import PostService from '@/services/post.service';
import { notifyError, notifySuccess } from '@/components/common/Notify';

const SpaceWall = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { space, canManageMembers, canPost } = useContext(SpaceContext);

    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchPosts = useCallback((pageNum = 1) => {
        if (!space?.username) return;
        if (pageNum === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        SpaceService.getSpacePosts(space.username, pageNum)
            .onSuccess((res) => {
                const newPosts = Array.isArray(res.posts)
                    ? res.posts
                    : (res.posts?.data || []);
                const meta = res.meta || res.posts?.meta;

                setPosts(prev => (pageNum === 1 ? newPosts : [...prev, ...newPosts]));
                setHasMore(meta ? meta.current_page < meta.last_page : false);
            })
            .onError(() => {
                setError(true);
            })
            .onFinally(() => {
                setIsLoadingInitial(false);
                setIsLoadingMore(false);
            });
    }, [space?.username]);

    useEffect(() => {
        setPage(1);
        fetchPosts(1);
    }, [fetchPosts]);

    const loadMore = () => {
        if (!isLoadingMore && hasMore && !error) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(nextPage);
        }
    };

    const handlePostCreated = (finalData) => {
        return new Promise((resolve) => {
            PostService.create({
                ...finalData,
                target_username: space.username
            })
                .onSuccess((res) => {
                    if (res.post) {
                        setPosts(prev => [res.post, ...prev]);
                    }
                    notifySuccess(t(`api.success.${res.code}`));
                    resolve(true);
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                    resolve(false);
                });
        });
    };

    const handleDeletePost = (postId) => {
        if (!window.confirm(t('common.confirm_action'))) return;

        PostService.delete(postId)
            .onSuccess((res) => {
                setPosts(prev => prev.filter(p => p.id !== postId));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const handlePinToggle = (postId) => {
        PostService.togglePin(postId)
            .onSuccess((res) => {
                fetchPosts(1);
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    if (!space) return null;

    return (
        <>
            {canPost && (
                <div className="mb-[10px]">
                    <CreatePostForm
                        space={space}
                        targetUsername={space.username}
                        currentUser={user}
                        isSpaceAdmin={canPost}
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
                className="tetrone-feed-list flex flex-col gap-[10px]"
                emptyState={
                    <div className="p-[20px] text-center text-text-muted border border-border bg-bg-box">
                        {t('spaces.wall_empty')}
                    </div>
                }
            >
                {posts.map(post => (
                    <PostItem
                        key={post.id}
                        post={post}
                        currentUsername={user?.username}
                        isOwner={canManageMembers}
                        onDelete={handleDeletePost}
                        onPinToggle={canManageMembers ? handlePinToggle : null}
                    />
                ))}
            </InfiniteScrollList>
        </>
    );
};

export default SpaceWall;