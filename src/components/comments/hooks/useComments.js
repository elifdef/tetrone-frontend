import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CommentService from "../../../services/comment.service";
import { notifyError } from "../../common/Notify";
import { useTranslation } from 'react-i18next';
import { useModal } from "../../../context/ModalContext";

export const useComments = (postId) =>
{
    const { t } = useTranslation();
    const { openConfirm } = useModal();
    const queryClient = useQueryClient();
    const queryKey = ['comments', postId];

    const {
        data, isLoading, isError, fetchNextPage,
        hasNextPage, isFetchingNextPage, refetch
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 1 }) => CommentService.getComments(postId, pageParam),
        getNextPageParam: (lastPage) =>
        {
            const meta = lastPage?.meta;
            return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
        },
        enabled: !!postId
    });

    const flatComments = data?.pages.flatMap(page => page?.comments || []) || [];

    const addMutation = useMutation({
        mutationFn: ({ content, parentId }) => CommentService.addComment(postId, content, parentId),
        onSuccess: (res) =>
        {
            queryClient.setQueryData(queryKey, (oldData) =>
            {
                if (!oldData)
                {
                    return oldData;
                }

                const newPages = [...oldData.pages];

                if (newPages.length > 0)
                {
                    if (res.comment.parent_id)
                    {
                        // Якщо це ВІДПОВІДЬ: додаємо в кінець останньої сторінки
                        const lastIndex = newPages.length - 1;
                        newPages[lastIndex] = {
                            ...newPages[lastIndex],
                            comments: [...newPages[lastIndex].comments, res.comment]
                        };
                    }
                    else
                    {
                        // Якщо це КОРЕНЕВИЙ коментар: додаємо на самий початок
                        newPages[0] = {
                            ...newPages[0],
                            comments: [res.comment, ...newPages[0].comments]
                        };
                    }
                }

                return { ...oldData, pages: newPages };
            });
        },
        onError: (err) =>
        {
            notifyError(err?.response?.data?.message || t('error.save_failed'));
        }
    });

    const editMutation = useMutation({
        mutationFn: ({ id, content }) => CommentService.update(id, content),
        onSuccess: (res, variables) =>
        {
            queryClient.setQueryData(queryKey, (oldData) =>
            {
                if (!oldData)
                {
                    return oldData;
                }
                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        comments: page.comments.map(c => c.id === variables.id ? res.comment : c)
                    }))
                };
            });
        },
        onError: (err) =>
        {
            notifyError(t('error.save_failed'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (commentId) => CommentService.delete(commentId),
        onSuccess: (res, commentId) =>
        {
            queryClient.setQueryData(queryKey, (oldData) =>
            {
                if (!oldData)
                {
                    return oldData;
                }
                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        comments: page.comments.filter(c => c.id !== commentId)
                    }))
                };
            });
        },
        onError: (err) =>
        {
            notifyError(t('error.delete_failed'));
        }
    });

    const addComment = async (content, parentId = null) =>
    {
        if (!content)
        {
            return false;
        }
        if (typeof content === 'string' && !content.trim())
        {
            return false;
        }

        try
        {
            await addMutation.mutateAsync({ content, parentId });
            return true;
        } catch (e)
        {
            return false;
        }
    };

    const editComment = async (commentId, newContent) =>
    {
        if (!newContent)
        {
            return false;
        }
        if (typeof newContent === 'string' && !newContent.trim())
        {
            return false;
        }

        try
        {
            await editMutation.mutateAsync({ id: commentId, content: newContent });
            return true;
        } catch (e)
        {
            return false;
        }
    };

    const removeComment = async (commentId) =>
    {
        const isConfirmed = await openConfirm(t('action.delete'));
        if (!isConfirmed)
        {
            return false;
        }

        try
        {
            await deleteMutation.mutateAsync(commentId);
            return true;
        } catch (e)
        {
            return false;
        }
    };

    return {
        comments: flatComments,
        isLoadingInitial: isLoading,
        isLoadingMore: isFetchingNextPage,
        hasMore: !!hasNextPage,
        error: isError,
        fetchComments: refetch,
        loadMore: fetchNextPage,
        addComment,
        editComment,
        removeComment
    };
};