import fetchClient from "../api/client";

const ActivityService = {
    async getCounts() {
        return await fetchClient(`/activity/counts`);
    },
    async getLikedPosts(page = 1) {
        return await fetchClient(`/activity/liked?page=${page}`);
    },
    async getMyComments(page = 1) {
        return await fetchClient(`/activity/comments?page=${page}`);
    },
    async getMyReposts(page = 1) {
        return await fetchClient(`/activity/reposts?page=${page}`);
    },
    async getVotedPolls(page = 1) {
        return await fetchClient(`/activity/voted-polls?page=${page}`);
    },
    async getScreenTime() {
        return await fetchClient(`/activity/screen-time`);
    },
}

export default ActivityService;