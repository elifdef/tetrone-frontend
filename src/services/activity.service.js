import fetchClient from "../api/client";

const ActivityService = {
    getCounts: () => fetchClient(`/activity/counts`),
    getLikedPosts: (page = 1) => {
        return fetchClient(`/activity/liked?page=${page}`);
    },
    getMyComments: (page = 1) => {
        return fetchClient(`/activity/comments?page=${page}`);
    },
    getMyReposts: (page = 1) => {
        return fetchClient(`/activity/reposts?page=${page}`);
    },
    getVotedPolls: (page = 1) => {
        return fetchClient(`/activity/voted-polls?page=${page}`);
    },
    getScreenTime: () => {
        return fetchClient(`/activity/screen-time`);
    },
    syncScreenTime: (seconds) => {
        return fetchClient('/activity/screen-time/sync', {
            method: 'POST',
            body: { seconds },
            silentAuth: true
        });
    }
}

export default ActivityService;