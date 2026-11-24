import fetchClient from '../api/client';
import type { TipTapDoc } from '@/types/user';

const CommentService = {
    getComments: async (postId: number | string, page = 1) =>
        fetchClient(`/posts/${postId}/comments?page=${page}`),

    addComment: async (
        postId: number | string,
        content: TipTapDoc | string | Record<string, unknown>,
        parentId: number | string | null = null
    ) =>
        fetchClient(`/posts/${postId}/comments`, {
            method: 'POST',
            body: {
                payload: content,
                parent_id: parentId,
            },
        }),

    update: async (
        commentId: number | string,
        content: TipTapDoc | string | Record<string, unknown>
    ) =>
        fetchClient(`/comments/${commentId}`, {
            method: 'PUT',
            body: {
                payload: content,
            },
        }),

    delete: async (commentId: number | string) =>
        fetchClient(`/comments/${commentId}`, { method: 'DELETE' }),

    toggleLike: async (commentId: number | string) =>
        fetchClient(`/comments/${commentId}/like`, { method: 'POST' }),

    toggleReaction: async (commentId: number | string, stickerId: number | string) =>
        fetchClient(`/comments/${commentId}/reactions`, {
            method: 'POST',
            body: { sticker_id: stickerId },
        }),
};

export default CommentService;