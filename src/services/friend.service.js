import fetchClient from "../api/client";

class FriendService {
    async getList(tab, query = '', signal = null, targetUsername = null) {
        let endpoint = '/friends';

        if (targetUsername) {
            if (tab === 'followers' || tab === 'subscriptions') {
                endpoint = `/friends/user/${targetUsername}/followers`;
            } else {
                endpoint = `/friends/user/${targetUsername}`;
            }

            if (query) {
                endpoint += `?filter[search]=${encodeURIComponent(query)}`;
            }
            return await fetchClient(endpoint, { signal });
        }

        switch (tab) {
            case 'requests': endpoint = '/friends/requests'; break;
            case 'subscriptions': endpoint = '/friends/sent'; break;
            case 'blocked': endpoint = '/friends/blocked'; break;
            case 'all':
                const params = new URLSearchParams();
                if (query) params.append('filter[search]', query);
                endpoint = `/users?${params.toString()}`;
                break;
            default: endpoint = '/friends'; break;
        }

        return await fetchClient(endpoint, { signal });
    }

    async addFriend(username) {
        return await fetchClient(`/friends/add/${username}`, { method: 'POST' });
    }

    async acceptRequest(username) {
        return await fetchClient(`/friends/accept/${username}`, { method: 'POST' });
    }

    async removeFriend(username) {
        return await fetchClient(`/friends/${username}`, { method: 'DELETE' });
    }

    async blockUser(username) {
        return await fetchClient(`/friends/block/${username}`, { method: 'POST' });
    }

    async unblockUser(username) {
        return await fetchClient(`/friends/blocked/${username}`, { method: 'DELETE' });
    }
}

export default new FriendService();