import fetchClient from "../api/client";

const FeedService = {
    getFeed: async (tab, pageNumber = 1, signal, hashtag = null) => {
        let url = tab === 'global' ? `/feed/global?page=${pageNumber}` : `/feed?page=${pageNumber}`;

        if (hashtag)
        {
            url += `&hashtag=${encodeURIComponent(hashtag)}`;
        }

        return fetchClient(url, {signal});
    }
}

export default FeedService;