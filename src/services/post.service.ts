import fetchClient from '../api/client';
import type { TipTapDoc } from '@/types/user';

export interface PostUploadFile extends File {
    is_spoiler?: boolean;
    is_nsfw?: boolean;
    custom_title?: string;
    custom_cover?: File | Blob | null;
}

export interface CreatePostPayload {
    payload?: TipTapDoc | Record<string, unknown> | null;
    space_username?: string | null;
    is_posted_as_space?: boolean;
    target_username?: string | null;
    author_username?: string | null;
    original_post_id?: number | string | null;
    published_at?: string | null;
    can_comment?: boolean;
    images?: PostUploadFile[];
}

export interface UpdatePostPayload {
    payload?: TipTapDoc | Record<string, unknown> | null;
    images?: PostUploadFile[];
    deletedMedia?: Array<string | number>;
}

class PostService {
    create(data: CreatePostPayload) {
        const hasFiles = Boolean(data.images && data.images.length > 0);

        const requestData = {
            payload: data.payload || null,
            space_username: data.space_username || null,
            is_posted_as_space: data.is_posted_as_space || false,
            target_username: data.target_username || null,
            author_username: data.author_username || null,
            original_post_id: data.original_post_id || null,
            published_at: data.published_at || null,
            can_comment: data.can_comment !== undefined ? data.can_comment : true,
        };

        if (hasFiles && data.images) {
            const formData = new FormData();

            if (requestData.payload) formData.append('payload', JSON.stringify(requestData.payload));
            if (requestData.space_username) formData.append('space_username', requestData.space_username);
            if (requestData.is_posted_as_space) formData.append('is_posted_as_space', '1');
            if (requestData.target_username) formData.append('target_username', requestData.target_username);
            if (requestData.author_username) formData.append('author_username', requestData.author_username);
            if (requestData.original_post_id) formData.append('original_post_id', String(requestData.original_post_id));
            if (requestData.published_at) formData.append('published_at', requestData.published_at);

            formData.append('can_comment', requestData.can_comment ? '1' : '0');

            data.images.forEach((file, index) => {
                formData.append('media[]', file);
                formData.append(`media_spoiler[${index}]`, file.is_spoiler ? '1' : '0');
                formData.append(`media_nsfw[${index}]`, file.is_nsfw ? '1' : '0');
                if (file.custom_title && file.custom_title.trim() !== '') {
                    formData.append(`media_titles[${index}]`, file.custom_title.trim());
                }
                if (file.custom_cover instanceof File || file.custom_cover instanceof Blob) {
                    const coverName = file.custom_cover instanceof File ? file.custom_cover.name : 'cover.jpg';
                    formData.append(`media_covers[${index}]`, file.custom_cover, coverName || 'cover.jpg');
                }
            });

            return fetchClient('/posts', { method: 'POST', body: formData });
        }

        return fetchClient('/posts', {
            method: 'POST',
            body: requestData,
        });
    }

    update(id: number | string, data: UpdatePostPayload) {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (data.payload) {
            formData.append('payload', JSON.stringify(data.payload));
        }

        if (data.images && data.images.length > 0) {
            data.images.forEach((file, index) => {
                formData.append('media[]', file);
                formData.append(`media_spoiler[${index}]`, file.is_spoiler ? '1' : '0');
                formData.append(`media_nsfw[${index}]`, file.is_nsfw ? '1' : '0');
                if (file.custom_title && file.custom_title.trim() !== '') {
                    formData.append(`media_titles[${index}]`, file.custom_title.trim());
                }
                if (file.custom_cover instanceof File || file.custom_cover instanceof Blob) {
                    const coverName = file.custom_cover instanceof File ? file.custom_cover.name : 'cover.jpg';
                    formData.append(`media_covers[${index}]`, file.custom_cover, coverName || 'cover.jpg');
                }
            });
        }

        if (data.deletedMedia && data.deletedMedia.length > 0) {
            data.deletedMedia.forEach((mediaId) => formData.append('deleted_media[]', String(mediaId)));
        }

        return fetchClient(`/posts/${id}`, { method: 'POST', body: formData });
    }

    get(id: number | string) {
        return fetchClient(`/posts/${id}`);
    }

    delete(id: number | string) {
        return fetchClient(`/posts/${id}`, { method: 'DELETE' });
    }

    publishNow(id: number | string) {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('is_published', '1');
        formData.append('published_at', '');

        return fetchClient(`/posts/${id}`, { method: 'POST', body: formData });
    }

    togglePin(id: number | string) {
        return fetchClient(`/posts/${id}/pin`, { method: 'POST' });
    }

    toggleLike(postId: number | string) {
        return fetchClient(`/posts/${postId}/like`, { method: 'POST' });
    }

    getUserPosts(username: string, pageNumber = 1, tab = 'all') {
        return fetchClient(`/users/${encodeURIComponent(username)}/posts?page=${pageNumber}&tab=${tab}`);
    }

    votePoll(postId: number | string, optionIds: Array<number | string>) {
        return fetchClient(`/posts/${postId}/poll/vote`, {
            method: 'POST',
            body: { option_ids: optionIds },
        });
    }

    getPollVoters(postId: number | string) {
        return fetchClient(`/posts/${postId}/poll/voters`);
    }

    closePoll(postId: number | string) {
        return fetchClient(`/posts/${postId}/poll/close`, { method: 'POST' });
    }

    getUserAvatars(username: string) {
        return fetchClient(`/users/${encodeURIComponent(username)}/avatars`);
    }

    toggleReaction(postId: number | string, stickerId: number | string) {
        return fetchClient(`/posts/${postId}/reactions`, {
            method: 'POST',
            body: { sticker_id: stickerId },
        });
    }

    updateReactionConfig(postId: number | string, configData: Record<string, unknown>) {
        return fetchClient(`/posts/${postId}/reaction-config`, {
            method: 'PUT',
            body: configData,
        });
    }

    getPollStats(postId: number | string) {
        return fetchClient(`/posts/${postId}/poll/stats`);
    }
}

export default new PostService();