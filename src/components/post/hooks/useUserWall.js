import { useCallback, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { notifyError, notifySuccess } from "../../common/Notify";
import { useModal } from "../../../context/ModalContext";
import PostService from '../../../services/post.service';

export const useUserWall = (profileUser, activeTab = 'all') => {
    const { t } = useTranslation();
    const { openConfirm } = useModal();
    const queryClient = useQueryClient();

    const queryKey = ['wall', profileUser?.username, activeTab];
    const [editingPostId, setEditingPostId] = useState(null);

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 1 }) => PostService.getUserPosts(profileUser?.username, pageParam, activeTab),
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta;
            return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
        },
        initialPageParam: 1,
        enabled: !!profileUser?.username
    });

    const posts = data?.pages.flatMap(page => page.posts || []) || [];
    const countPosts = data?.pages[0]?.meta?.total || 0;

    const createMutation = useMutation({
        // ФІКС: Приймаємо єдиний готовий об'єкт postData, просто додаємо цільову стіну
        mutationFn: (postData) => PostService.create({ 
            ...postData, 
            target_username: profileUser.username 
        }),
        onSuccess: (res) => {
            if (res && res.ok) {
                const createdPost = res.post;

                if (!createdPost.is_published && activeTab !== 'scheduled') {
                    queryClient.invalidateQueries({ queryKey: ['wall', profileUser?.username, 'scheduled'] });
                    return;
                }

                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;
                    const newPages = [...oldData.pages];

                    if (newPages.length > 0 && createdPost) {
                        const currentPosts = newPages[0].posts || [];

                        if (currentPosts.length > 0 && currentPosts[0].is_pinned) {
                            newPages[0] = {
                                ...newPages[0],
                                posts: [currentPosts[0], createdPost, ...currentPosts.slice(1)]
                            };
                        } else {
                            newPages[0] = {
                                ...newPages[0],
                                posts: [createdPost, ...currentPosts]
                            };
                        }
                    }
                    return { ...oldData, pages: newPages };
                });
            } else {
                notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
            }
        }
    });

    const pinMutation = useMutation({
        mutationFn: (postId) => PostService.togglePin(postId),
        onSuccess: (res, pinnedId) => {
            if (res && res.ok) {
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;

                    let allPosts = oldData.pages.flatMap(page => page.posts || []);
                    const isPinning = res.code === 'POST_PINNED';

                    allPosts = allPosts.map(p => ({
                        ...p,
                        is_pinned: p.id === pinnedId ? isPinning : false
                    }));

                    allPosts.sort((a, b) => {
                        if (a.is_pinned) return -1;
                        if (b.is_pinned) return 1;
                        return new Date(b.created_at) - new Date(a.created_at);
                    });

                    let offset = 0;
                    const newPages = oldData.pages.map(page => {
                        const length = page.posts ? page.posts.length : 0;
                        const pagePosts = allPosts.slice(offset, offset + length);
                        offset += length;
                        return { ...page, posts: pagePosts };
                    });

                    return { ...oldData, pages: newPages };
                });
            } else {
                notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
            }
        }
    });

    const editMutation = useMutation({
        mutationFn: ({ postId, updateData }) => PostService.update(postId, updateData),
        onSuccess: (res, variables) => {
            if (res && res.ok) {
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;
                    const updatedPost = res.post || res.data;

                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            posts: (page.posts || []).map(p => p.id === variables.postId ? updatedPost : p)
                        }))
                    };
                });
                notifySuccess(t(`api.success.${res.code || 'SUCCESS'}`));
                setEditingPostId(null);
            } else {
                notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
            }
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (postId) => PostService.delete(postId),
        onSuccess: (res, deletedId) => {
            if (res && res.ok) {
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            posts: (page.posts || []).filter(p => p.id !== deletedId)
                        }))
                    };
                });
            } else {
                notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
            }
        }
    });

    const publishNowMutation = useMutation({
        mutationFn: (postId) => PostService.publishNow(postId),
        onSuccess: (res, publishedId) => {
            if (res && res.ok) {
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            posts: activeTab === 'scheduled'
                                ? (page.posts || []).filter(p => p.id !== publishedId)
                                : (page.posts || []).map(p => p.id === publishedId ? { ...p, is_published: true, published_at: null } : p)
                        }))
                    };
                });
                notifySuccess(t('post.published_success'));
            } else {
                notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
            }
        }
    });

    // ФІКС: Тепер ми приймаємо єдиний об'єкт postData, який згенерував useCreatePost
    const createPost = async (postData) => {
        await createMutation.mutateAsync(postData);
        return true;
    };

    const saveEdit = async (postId, updateData) => await editMutation.mutateAsync({ postId, updateData });

    const handleDelete = useCallback(async (postId) => {
        const isConfirmed = await openConfirm(t('action.delete'));
        if (!isConfirmed) return;
        await deleteMutation.mutateAsync(postId);
    }, [openConfirm, t, deleteMutation]);

    const handlePublishNow = useCallback(async (postId) => {
        const isConfirmed = await openConfirm(t('post.confirm_publish_now'));
        if (!isConfirmed) return;
        await publishNowMutation.mutateAsync(postId);
    }, [openConfirm, t, publishNowMutation]);

    const handlePinToggle = useCallback(async (postId) => {
        await pinMutation.mutateAsync(postId);
    }, [pinMutation]);

    const handleRepostSuccess = (newPost) => {
        queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData) return oldData;
            const newPages = [...oldData.pages];
            if (newPages.length > 0) {
                newPages[0] = { ...newPages[0], posts: [newPost, ...(newPages[0].posts || [])] };
            }
            return { ...oldData, pages: newPages };
        });
    };

    return {
        posts, countPosts, isPageLoading: isLoading, hasMore: !!hasNextPage, isLoadingMore: isFetchingNextPage,
        loadMore: fetchNextPage, createPost, handleDelete, editingPostId, handleRepostSuccess,
        startEditing: (post) => setEditingPostId(post.id), cancelEditing: () => setEditingPostId(null), saveEdit,
        handlePublishNow, handlePinToggle
    };
};