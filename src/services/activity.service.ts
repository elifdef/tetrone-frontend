import fetchClient from '../api/client';
import type {
    ActivityCommentsResponse,
    ActivityCountsResponse,
    ActivityPostsResponse,
    ScreenTimeResponse,
    ScreenTimeSyncResponse,
} from '@/types/activity';

const ActivityService = {
    getCounts: () => fetchClient<ActivityCountsResponse>('/activity/counts'),

    getLikedPosts: (page = 1) =>
        fetchClient<ActivityPostsResponse>(`/activity/liked?page=${page}`),

    getMyComments: (page = 1) =>
        fetchClient<ActivityCommentsResponse>(`/activity/comments?page=${page}`),

    getMyReposts: (page = 1) =>
        fetchClient<ActivityPostsResponse>(`/activity/reposts?page=${page}`),

    getVotedPolls: (page = 1) =>
        fetchClient<ActivityPostsResponse>(`/activity/voted-polls?page=${page}`),

    getScreenTime: () => fetchClient<ScreenTimeResponse>('/activity/screen-time'),

    syncScreenTime: (seconds: number) =>
        fetchClient<ScreenTimeSyncResponse>('/activity/screen-time/sync', {
            method: 'POST',
            body: { seconds },
            silentAuth: true,
        }),
};

export default ActivityService;