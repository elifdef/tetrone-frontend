import fetchClient from "../api/client";

class PostService {
    async create(data) {
        const hasFiles = data.images && data.images.length > 0;

        // Дані приходять чистими прямо з хука useCreatePost
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

        if (hasFiles) {
            const formData = new FormData();

            if (requestData.payload) formData.append('payload', JSON.stringify(requestData.payload));
            if (requestData.space_username) formData.append('space_username', requestData.space_username);
            if (requestData.is_posted_as_space) formData.append('is_posted_as_space', '1');
            if (requestData.target_username) formData.append('target_username', requestData.target_username);
            if (requestData.author_username) formData.append('author_username', requestData.author_username);
            if (requestData.original_post_id) formData.append('original_post_id', requestData.original_post_id);
            if (requestData.published_at) formData.append('published_at', requestData.published_at);
            
            // Відправляємо 1 або 0 для булевих значень
            formData.append('can_comment', requestData.can_comment ? '1' : '0');

            data.images.forEach((file, index) => {
                formData.append('media[]', file);
                formData.append(`media_spoiler[${index}]`, file.is_spoiler ? '1' : '0');
                formData.append(`media_nsfw[${index}]`, file.is_nsfw ? '1' : '0');
            });

            return await fetchClient('/posts', { method: 'POST', body: formData });
        }

        // Відправляємо JSON, якщо файлів немає
        return await fetchClient('/posts', {
            method: 'POST',
            body: requestData
        });
    }

    async update(id, data) {
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
            });
        }

        if (data.deletedMedia && data.deletedMedia.length > 0) {
            data.deletedMedia.forEach((mediaId) => formData.append('deleted_media[]', mediaId));
        }

        return await fetchClient(`/posts/${id}`, { method: 'POST', body: formData });
    }

    async get(id) {
        return await fetchClient(`/posts/${id}`);
    }

    async delete(id) {
        return await fetchClient(`/posts/${id}`, { method: 'DELETE' });
    }

    async publishNow(id) {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('is_published', '1');
        formData.append('published_at', ''); 

        return await fetchClient(`/posts/${id}`, { method: 'POST', body: formData });
    }

    async togglePin(id) {
        return await fetchClient(`/posts/${id}/pin`, { method: 'POST' });
    }

    async toggleLike(postId) {
        return await fetchClient(`/posts/${postId}/like`, { method: 'POST' });
    }

    async getUserPosts(username, pageNumber = 1, tab = 'all') {
        return await fetchClient(`/users/${username}/posts?page=${pageNumber}&tab=${tab}`);
    }

    async votePoll(postId, optionIds) {
        return await fetchClient(`/posts/${postId}/poll/vote`, {
            method: 'POST',
            body: { option_ids: optionIds }
        });
    }

    async getPollVoters(postId) {
        return await fetchClient(`/posts/${postId}/poll/voters`);
    }

    async closePoll(postId) {
        return await fetchClient(`/posts/${postId}/poll/close`, { method: 'POST' });
    }

    async getUserAvatars(username) {
        return await fetchClient(`/users/${username}/avatars`);
    }

    async toggleReaction(postId, stickerId) {
        return await fetchClient(`/posts/${postId}/reactions`, {
            method: 'POST',
            body: { sticker_id: stickerId }
        });
    }

    async updateReactionConfig(postId, configData) {
        return await fetchClient(`/posts/${postId}/reaction-config`, {
            method: 'PUT',
            body: configData
        });
    }

    // НОВИЙ МЕТОД ДЛЯ ГРАФІКІВ
    async getPollStats(postId) {
        return await fetchClient(`/posts/${postId}/poll/stats`);
    }
}

export default new PostService();