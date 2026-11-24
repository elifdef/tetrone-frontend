import fetchClient from '../api/client';
import type { ApiRequestHandle } from '@/types/api';
import type { UsersListResponse } from '@/types/user';

export type FriendListTab = 'my' | 'friends' | 'requests' | 'subscriptions' | 'blocked' | 'all' | 'followers';

class FriendService {
    getList(
        tab: FriendListTab | string,
        query = '',
        signal: AbortSignal | null = null,
        targetUsername: string | null = null
    ): ApiRequestHandle<UsersListResponse> {
        let endpoint = '/friends';

        if (targetUsername) {
            if (tab === 'followers' || tab === 'subscriptions') {
                endpoint = `/friends/user/${encodeURIComponent(targetUsername)}/followers`;
            } else {
                endpoint = `/friends/user/${encodeURIComponent(targetUsername)}`;
            }

            if (query) {
                endpoint += `?filter[search]=${encodeURIComponent(query)}`;
            }
            return fetchClient<UsersListResponse>(endpoint, { signal: signal ?? undefined });
        }

        switch (tab) {
            case 'requests':
                endpoint = '/friends/requests';
                break;
            case 'subscriptions':
                endpoint = '/friends/sent';
                break;
            case 'blocked':
                endpoint = '/friends/blocked';
                break;
            case 'all': {
                const params = new URLSearchParams();
                if (query) {
                    params.append('filter[search]', query);
                }
                endpoint = `/users?${params.toString()}`;
                break;
            }
            default: {
                const params = new URLSearchParams();
                if (query) {
                    params.append('filter[search]', query);
                }
                const qs = params.toString();
                endpoint = qs ? `/friends?${qs}` : '/friends';
                break;
            }
        }

        return fetchClient<UsersListResponse>(endpoint, { signal: signal ?? undefined });
    }

    addFriend(username: string): ApiRequestHandle<Record<string, unknown>> {
        return fetchClient(`/friends/add/${encodeURIComponent(username)}`, { method: 'POST' });
    }

    acceptRequest(username: string): ApiRequestHandle<Record<string, unknown>> {
        return fetchClient(`/friends/accept/${encodeURIComponent(username)}`, { method: 'POST' });
    }

    removeFriend(username: string): ApiRequestHandle<Record<string, unknown>> {
        return fetchClient(`/friends/${encodeURIComponent(username)}`, { method: 'DELETE' });
    }

    blockUser(username: string): ApiRequestHandle<Record<string, unknown>> {
        return fetchClient(`/friends/block/${encodeURIComponent(username)}`, { method: 'POST' });
    }

    unblockUser(username: string): ApiRequestHandle<Record<string, unknown>> {
        return fetchClient(`/friends/blocked/${encodeURIComponent(username)}`, { method: 'DELETE' });
    }
}

export default new FriendService();