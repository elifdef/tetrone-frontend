import fetchClient from "../api/client";

class PostService {
    async create(data) {
        const hasFiles = data.images && data.images.length > 0;

        const requestData = {
            payload: data.payload || null,
            space_id: data.space_id || (data.payload && data.payload.space_id) || null,
            is_posted_as_space: data.is_posted_as_space || (data.payload && data.payload.is_posted_as_space) || false,
            target_user_id: data.target_user_id || null,
            original_post_id: data.original_post_id || null,
        };

        if (hasFiles) {
            const formData = new FormData();

            if (requestData.payload) {
                formData.append('payload', JSON.stringify(requestData.payload));
            }

            if (requestData.space_id) formData.append('space_id', requestData.space_id);
            if (requestData.is_posted_as_space) formData.append('is_posted_as_space', '1');
            if (requestData.target_user_id) formData.append('target_user_id', requestData.target_user_id);
            if (requestData.original_post_id) formData.append('original_post_id', requestData.original_post_id);

            data.images.forEach((file, index) => formData.append(`media[${index}]`, file));

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
            if (data.payload.text) {
                formData.append('payload[text]', typeof data.payload.text === 'object' ? JSON.stringify(data.payload.text) : data.payload.text);
            }
            if (data.payload.poll) {
                formData.append('payload[poll]', JSON.stringify(data.payload.poll));
            }
            if (data.payload.youtube) {
                formData.append('payload[youtube]', JSON.stringify(data.payload.youtube));
            }
        }

        if (data.images && data.images.length > 0) {
            data.images.forEach((file, index) => formData.append(`media[${index}]`, file));
        }
        if (data.deletedMedia && data.deletedMedia.length > 0) {
            data.deletedMedia.forEach((mediaId, index) => formData.append(`deleted_media[${index}]`, mediaId));
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