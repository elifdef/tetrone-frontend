import fetchClient from "../api/client";

class PostService {
    async create(data) {
        const hasFiles = data.images && data.images.length > 0;

        const requestData = {
            payload: data.payload || null,
            space_username: data.space_username || null,
            is_posted_as_space: data.is_posted_as_space || false,
            target_username: data.target_username || null,
            original_post_id: data.original_post_id || null,
            published_at: data.published_at || null,
        };

        if (hasFiles) {
            const formData = new FormData();

            if (requestData.payload) {
                formData.append('payload', JSON.stringify(requestData.payload));
            }

            if (requestData.space_username) formData.append('space_username', requestData.space_username);
            if (requestData.is_posted_as_space) formData.append('is_posted_as_space', '1');
            if (requestData.target_username) formData.append('target_username', requestData.target_username);
            if (requestData.original_post_id) formData.append('original_post_id', requestData.original_post_id);
            if (requestData.published_at) formData.append('published_at', requestData.published_at);

            // ФІКС: Повернули цикл forEach
            data.images.forEach((file, index) => {
                formData.append('media[]', file);
                formData.append(`media_spoiler[${index}]`, file.is_spoiler ? '1' : '0');
                formData.append(`media_nsfw[${index}]`, file.is_nsfw ? '1' : '0');
            });

            return await fetchClient('/posts', { method: 'POST', body: formData });
        }

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
            // ФІКС: Додали прапорці і для методу оновлення
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

    async toggleLike(postId) {
        return await fetchClient(`/posts/${postId}/like`, { method: 'POST' });
    }

    async getUserPosts(username, pageNumber = 1) {
        return await fetchClient(`/users/${username}/posts?page=${pageNumber}`);
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
}

export default new PostService();