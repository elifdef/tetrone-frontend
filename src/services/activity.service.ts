import fetchClient from '../api/client';

const ActivityService = {
    getCounts: () => fetchClient('/activity/counts'),
    getLikedPosts: (page = 1) => fetchClient(`/activity/liked?page=${page}`),
    getMyComments: (page = 1) => fetchClient(`/activity/comments?page=${page}`),
    getMyReposts: (page = 1) => fetchClient(`/activity/reposts?page=${page}`),
    getVotedPolls: (page = 1) => fetchClient(`/activity/voted-polls?page=${page}`),
    getScreenTime: () => fetchClient('/activity/screen-time'),
    syncScreenTime: (seconds: number) =>
        fetchClient('/activity/screen-time/sync', {
            method: 'POST',
            body: { seconds },
            silentAuth: true,
        }),
};

export default ActivityService;