import {useCallback, useState} from 'react';
import {useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {useTranslation} from 'react-i18next';
import {notifyError, notifySuccess} from "../../common/Notify";
import {useModal} from "../../../context/ModalContext";
import PostService from '../../../services/post.service';

export const useUserWall = (profileUser) =>
{
    const {t} = useTranslation();
    const {openConfirm} = useModal();
    const queryClient = useQueryClient();
    const queryKey = ['wall', profileUser?.username];
    const [editingPostId, setEditingPostId] = useState(null);

    const {data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage} = useInfiniteQuery({
        queryKey,
        queryFn:          ({pageParam = 1}) => PostService.getUserPosts(profileUser?.username, pageParam),
        getNextPageParam: (lastPage) =>
                          {
                              const meta = lastPage?.meta;
                              return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
                          },
        initialPageParam: 1,
        enabled:          !!profileUser?.username
    });

    // Витягуємо пости з кожної сторінки
    const posts = data?.pages.flatMap(page => page.posts || []) || [];
    const countPosts = data?.pages[0]?.meta?.total || 0;

    const createMutation = useMutation({
        mutationFn: ({payload, images}) => PostService.create({payload, images, target_username: profileUser.username}),
        onSuccess:  (res) =>
                    {
                        if (res && res.ok)
                        { // ФІКС: перевіряємо res.ok замість res
                            queryClient.setQueryData(queryKey, (oldData) =>
                            {
                                if (!oldData) return oldData;
                                const newPages = [...oldData.pages];
                                const createdPost = res.post;

                                if (newPages.length > 0 && createdPost)
                                {
                                    newPages[0] = {...newPages[0], posts: [createdPost, ...(newPages[0].posts || [])]};
                                }
                                return {...oldData, pages: newPages};
                            });
                        } else
                        {
                            notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
                        }
                    }
    });

    const editMutation = useMutation({
        mutationFn: ({postId, updateData}) => PostService.update(postId, updateData),
        onSuccess:  (res, variables) =>
                    {
                        if (res && res.ok)
                        { // ФІКС: раніше тут було res.success (яке undefined)
                            queryClient.setQueryData(queryKey, (oldData) =>
                            {
                                if (!oldData) return oldData;
                                const updatedPost = res.post || res.data;

                                return {
                                    ...oldData,
                                    pages: oldData.pages.map(page => ({
                                        ...page,
                                        // Шукаємо і замінюємо пост у масиві posts
                                        posts: (page.posts || []).map(p => p.id === variables.postId ? updatedPost : p)
                                    }))
                                };
                            });
                            notifySuccess(t(`api.success.${res.code || 'SUCCESS'}`));
                            setEditingPostId(null);
                        } else
                        {
                            notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
                        }
                    }
    });

    const deleteMutation = useMutation({
        mutationFn: (postId) => PostService.delete(postId),
        onSuccess:  (res, deletedId) =>
                    {
                        if (res && res.ok)
                        { // ФІКС: перевіряємо res.ok
                            queryClient.setQueryData(queryKey, (oldData) =>
                            {
                                if (!oldData) return oldData;
                                return {
                                    ...oldData,
                                    pages: oldData.pages.map(page => ({
                                        ...page,
                                        // Фільтруємо масив posts
                                        posts: (page.posts || []).filter(p => p.id !== deletedId)
                                    }))
                                };
                            });
                        } else
                        {
                            notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
                        }
                    }
    });

    const createPost = async (payload, images) =>
    {
        await createMutation.mutateAsync({payload, images});
        return true;
    };

    const saveEdit = async (postId, updateData) => await editMutation.mutateAsync({postId, updateData});

    const handleDelete = useCallback(async (postId) =>
    {
        const isConfirmed = await openConfirm(t('action.delete'));
        if (!isConfirmed) return;
        await deleteMutation.mutateAsync(postId);
    }, [openConfirm, t, deleteMutation]);

    const handleRepostSuccess = (newPost) =>
    {
        queryClient.setQueryData(queryKey, (oldData) =>
        {
            if (!oldData) return oldData;
            const newPages = [...oldData.pages];
            if (newPages.length > 0)
            {
                newPages[0] = {...newPages[0], posts: [newPost, ...(newPages[0].posts || [])]};
            }
            return {...oldData, pages: newPages};
        });
    };

    return {
        posts, countPosts, isPageLoading: isLoading, hasMore: !!hasNextPage, isLoadingMore: isFetchingNextPage,
        loadMore:                         fetchNextPage, createPost, handleDelete, editingPostId, handleRepostSuccess,
        startEditing:                     (post) => setEditingPostId(post.id), cancelEditing: () => setEditingPostId(null), saveEdit
    };
};