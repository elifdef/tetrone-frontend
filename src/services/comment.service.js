import fetchClient from "../api/client";

const CommentService = {
    getComments: async (postId, page = 1) =>
    {
        return fetchClient(`/posts/${ postId }/comments?page=${ page }`);
    },

    addComment: async (postId, content, parentId = null) =>
    {
        return fetchClient(`/posts/${ postId }/comments`, {
            method: 'POST',
            body: {
                payload: content,
                parent_id: parentId
            }
        });
    },

    update: async (commentId, content) =>
    {
        return fetchClient(`/comments/${ commentId }`, {
            method: 'PUT',
            body: {
                payload: content
            }
        });
    },

    delete: async (commentId) =>
    {
        return fetchClient(`/comments/${ commentId }`, { method: 'DELETE' });
    },

    toggleLike: async (commentId) =>
    {
        return fetchClient(`/comments/${ commentId }/like`, { method: 'POST' });
    },

    toggleReaction: async (commentId, stickerId) =>
    {
        return fetchClient(`/comments/${ commentId }/reactions`, {
            method: 'POST',
            body: { sticker_id: stickerId }
        });
    }
}

export default CommentService;