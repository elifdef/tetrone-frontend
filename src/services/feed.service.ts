import fetchClient from '../api/client';

const FeedService = {
    getFeed: async (
        tab: string,
        pageNumber = 1,
        signal?: AbortSignal | null,
        hashtag: string | null = null
    ) => {
        let url = tab === 'global' ? `/feed/global?page=${pageNumber}` : `/feed?page=${pageNumber}`;

        if (hashtag) {
            url += `&hashtag=${encodeURIComponent(hashtag)}`;
        }

        return fetchClient(url, { signal });
    },
};

export default FeedService;