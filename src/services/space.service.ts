import fetchClient from '@/api/client';
import type { ApiRequestHandle } from '@/types/api';
import type {
    SpaceActionResponse,
    SpaceInviteCreatePayload,
    SpaceInviteResponse,
    SpaceInvitesResponse,
    SpaceMembersResponse,
    SpacePostsResponse,
    SpaceResponse,
    SpacesListResponse,
    SpaceStatsResponse,
    SpaceUpdatePayload,
    UpdateMemberRolePayload,
} from '@/types/space';

export type SpaceQueryParams = Record<string, string | number | boolean | undefined | null>;

const toQuery = (params: SpaceQueryParams = {}): string => {
    const entries: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            entries[key] = String(value);
        }
    }
    const query = new URLSearchParams(entries).toString();
    return query ? `?${query}` : '';
};

const SpaceService = {
    createSpace: (payload: FormData | Record<string, unknown>): ApiRequestHandle<SpaceResponse> =>
        fetchClient<SpaceResponse>('/spaces', { method: 'POST', body: payload }),

    updateSpace: (
        username: string,
        payload: FormData | SpaceUpdatePayload
    ): ApiRequestHandle<SpaceResponse> => {
        const isFormData = payload instanceof FormData;
        if (isFormData && !payload.has('_method')) {
            payload.append('_method', 'PUT');
        }

        return fetchClient<SpaceResponse>(`/spaces/${encodeURIComponent(username)}`, {
            method: isFormData ? 'POST' : 'PUT',
            body: payload as FormData | Record<string, unknown>,
        });
    },

    getSpace: (username: string, params: SpaceQueryParams = {}): ApiRequestHandle<SpaceResponse> =>
        fetchClient<SpaceResponse>(`/spaces/${encodeURIComponent(username)}${toQuery(params)}`),

    getSpacesList: (params: SpaceQueryParams = {}): ApiRequestHandle<SpacesListResponse> =>
        fetchClient<SpacesListResponse>(`/spaces${toQuery(params)}`),

    getSpacePosts: (username: string, page = 1): ApiRequestHandle<SpacePostsResponse> =>
        fetchClient<SpacePostsResponse>(`/spaces/${encodeURIComponent(username)}/posts?page=${page}`),

    joinSpace: (username: string, token: string | null = null): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(`/spaces/${encodeURIComponent(username)}/join`, {
            method: 'POST',
            body: token ? { invite_token: token } : {},
        }),

    leaveSpace: (username: string): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(`/spaces/${encodeURIComponent(username)}/leave`, {
            method: 'POST',
        }),

    deleteSpace: (username: string): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(`/spaces/${encodeURIComponent(username)}`, {
            method: 'DELETE',
        }),

    getSpaceMembers: (
        username: string,
        params: SpaceQueryParams = {}
    ): ApiRequestHandle<SpaceMembersResponse> =>
        fetchClient<SpaceMembersResponse>(`/spaces/${encodeURIComponent(username)}/members${toQuery(params)}`),

    approveMember: (
        spaceUsername: string,
        targetUsername: string
    ): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(
            `/spaces/${encodeURIComponent(spaceUsername)}/members/${encodeURIComponent(targetUsername)}/approve`,
            { method: 'POST' }
        ),

    rejectMember: (
        spaceUsername: string,
        targetUsername: string
    ): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(
            `/spaces/${encodeURIComponent(spaceUsername)}/members/${encodeURIComponent(targetUsername)}/reject`,
            { method: 'POST' }
        ),

    updateMemberRole: (
        spaceUsername: string,
        targetUsername: string,
        payload: UpdateMemberRolePayload
    ): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(
            `/spaces/${encodeURIComponent(spaceUsername)}/members/${encodeURIComponent(targetUsername)}/role`,
            { method: 'PUT', body: payload as unknown as Record<string, unknown> }
        ),

    kickMember: (
        spaceUsername: string,
        targetUsername: string
    ): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(
            `/spaces/${encodeURIComponent(spaceUsername)}/members/${encodeURIComponent(targetUsername)}`,
            { method: 'DELETE' }
        ),

    getInvites: (username: string): ApiRequestHandle<SpaceInvitesResponse> =>
        fetchClient<SpaceInvitesResponse>(`/spaces/${encodeURIComponent(username)}/invites`),

    createInvite: (
        username: string,
        payload: SpaceInviteCreatePayload
    ): ApiRequestHandle<SpaceInviteResponse> =>
        fetchClient<SpaceInviteResponse>(`/spaces/${encodeURIComponent(username)}/invites`, {
            method: 'POST',
            body: payload as unknown as Record<string, unknown>,
        }),

    revokeInvite: (username: string, token: string): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(
            `/spaces/${encodeURIComponent(username)}/invites/${encodeURIComponent(token)}`,
            { method: 'DELETE' }
        ),

    revokeOthers: (username: string, token: string): ApiRequestHandle<SpaceActionResponse> =>
        fetchClient<SpaceActionResponse>(
            `/spaces/${encodeURIComponent(username)}/invites/${encodeURIComponent(token)}/others`,
            { method: 'DELETE' }
        ),

    getSpaceStats: (username: string): ApiRequestHandle<SpaceStatsResponse> =>
        fetchClient<SpaceStatsResponse>(`/spaces/${encodeURIComponent(username)}/stats`),
};

export default SpaceService;