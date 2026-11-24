import { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import { SpaceContext } from '@/context/space-context';
import SpaceService from '@/services/space.service';
import InfiniteScrollList from '@/components/common/InfiniteScrollList';
import PostItem from '@/components/post/PostItem';
import CreatePostForm from '@/components/post/CreatePostForm';
import PostService from '@/services/post.service';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import type { SpaceData, SpacePost } from '@/types/space';

interface SpaceWallContentProps {
    space: SpaceData;
    canManageMembers: boolean;
    canPost: boolean;
}

const SpaceWallContent = ({ space, canManageMembers, canPost }: SpaceWallContentProps) => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);

    const [posts, setPosts] = useState<SpacePost[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const spaceUsername = space.username;

    const fetchPosts = useCallback((pageNum = 1) => {
        if (pageNum === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        SpaceService.getSpacePosts(spaceUsername, pageNum)
            .onSuccess((res) => {
                const newPosts = Array.isArray(res.posts)
                    ? res.posts
                    : (res.posts?.data ?? []);
                const meta = res.meta || (!Array.isArray(res.posts) ? res.posts?.meta : undefined);

                setPosts((prev) => (pageNum === 1 ? newPosts : [...prev, ...newPosts]));
                setHasMore(meta ? meta.current_page < meta.last_page : false);
            })
            .onError(() => {
                setError(true);
            })
            .onFinally(() => {
                setIsLoadingInitial(false);
                setIsLoadingMore(false);
            });
    }, [spaceUsername]);

    useEffect(() => {
        let cancelled = false;

        SpaceService.getSpacePosts(spaceUsername, 1)
            .onSuccess((res) => {
                if (cancelled) return;
                const newPosts = Array.isArray(res.posts)
                    ? res.posts
                    : (res.posts?.data ?? []);
                const meta = res.meta || (!Array.isArray(res.posts) ? res.posts?.meta : undefined);

                setPosts(newPosts);
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
                }
            });

        return () => {
            cancelled = true;
        };
    }, [spaceUsername]);

    const loadMore = () => {
        if (!isLoadingMore && hasMore && !error) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(nextPage);
        }
    };

    const handlePostCreated = (finalData: Record<string, unknown>): Promise<boolean> => {
        return new Promise((resolve) => {
            PostService.create({
                ...finalData,
                target_username: space.username,
            })
                .onSuccess((res: { code?: string; post?: SpacePost }) => {
                    if (res.post) {
                        const createdPost = res.post;
                        setPosts((prev) => [createdPost, ...prev]);
                    }
                    notifySuccess(t(`api.success.${res.code}`));
                    resolve(true);
                })
                .onError((err: { code?: string }) => {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                    resolve(false);
                });
        });
    };

    const handleDeletePost = (postId: number | string) => {
        if (!window.confirm(t('common.confirm_action'))) return;

        PostService.delete(postId)
            .onSuccess((res: { code?: string }) => {
                setPosts((prev) => prev.filter((p) => p.id !== postId));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err: { code?: string }) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const handlePinToggle = (postId: number | string) => {
        PostService.togglePin(postId)
            .onSuccess((res: { code?: string }) => {
                fetchPosts(1);
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err: { code?: string }) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

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
                {posts.map((post) => (
                    <PostItem
                        key={post.id}
                        post={post}
                        currentUsername={user?.username}
                        isOwner={canManageMembers}
                        onDelete={handleDeletePost}
                        onPinToggle={canManageMembers ? handlePinToggle : undefined}
                    />
                ))}
            </InfiniteScrollList>
        </>
    );
};

const SpaceWall = () => {
    const { space, canManageMembers, canPost } = useContext(SpaceContext);

    if (!space) return null;

    return (
        <SpaceWallContent
            key={space.username}
            space={space}
            canManageMembers={canManageMembers}
            canPost={canPost}
        />
    );
};

export default SpaceWall;