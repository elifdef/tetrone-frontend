import type { PaginationMeta } from './api';
import type { TipTapDoc } from './tiptap';

export type SpacePrivacy = 'public' | 'private' | 'closed';

export type SpaceRole = 'owner' | 'admin' | 'moderator' | 'member';

export type SpaceStaffRole = Exclude<SpaceRole, 'member'>;

export type SpaceMemberStatus = 'approved' | 'pending' | 'invited' | 'muted' | 'banned';

export type SpacePostingRule = 'all' | 'admins';

export type SpaceInviteType = 'join' | 'role_grant' | 'registration' | 'guest_access';

export interface SpaceLink {
    title: string;
    url: string;
}

export interface SpaceUserSummary {
    username: string;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
}

export interface SpacePreviewMember extends SpaceUserSummary {
    role: SpaceRole;
    custom_title: string | null;
}

export interface SpaceData {
    name: string;
    username: string;
    aliases: string[] | null;
    description: TipTapDoc | string | null;
    rules: TipTapDoc | string | null;
    links: SpaceLink[] | null;
    privacy_type: SpacePrivacy | null;
    posting_rule: SpacePostingRule | null;
    is_members_hidden: boolean;
    avatar: string | null;
    owner: SpaceUserSummary | null;
    is_member: boolean | null;
    membership_status: SpaceMemberStatus | null;
    member_role: SpaceRole | null;
    can_view_content: boolean;
    is_notifications_muted: boolean;
    members_count: number;
    pending_requests_count: number | null;
    preview_members: SpacePreviewMember[] | null;
    created_at: string | null;
}

export interface SpaceMemberItem {
    id?: number;
    role: SpaceRole;
    status?: SpaceMemberStatus;
    custom_title: string | null;
    joined_at?: string | null;
    user: SpaceUserSummary;
}

export interface SpaceMemberCounts {
    approved: number;
    staff: number;
    pending: number | null;
}

export interface SpaceInviteRules {
    auto_approve?: boolean;
    assign_role?: Exclude<SpaceRole, 'owner'>;
    min_account_age_days?: number;
    require_verified_email?: boolean;
    note?: string;
}

export interface SpaceInviteData {
    token: string;
    type: SpaceInviteType | string;
    rules: SpaceInviteRules | null;
    max_uses: number | null;
    uses_count: number;
    expires_at: string | null;
    creator: SpaceUserSummary | null;
    target_user: SpaceUserSummary | null;
    created_at: string | null;
}

export interface SpaceInviteCreatePayload {
    max_uses?: number;
    expires_at?: string;
    target_username?: string;
    type?: SpaceInviteType;
    rules?: SpaceInviteRules;
}

export interface SpaceDemographicItem {
    key?: string;
    label?: string;
    percentage: number;
    count: number;
    color?: string;
}

export interface SpaceDailyActivityItem {
    date: string;
    posts: number;
    comments: number;
    likes: number;
    new_members: number;
}

export interface SpaceRecentJoinedMember {
    username: string;
    first_name: string | null;
    last_name?: string | null;
    avatar: string | null;
    role: SpaceRole;
    joined_at: string | null;
}

export interface SpaceTopContributor {
    username: string;
    first_name: string | null;
    last_name?: string | null;
    avatar: string | null;
    posts_count: number;
    comments_count: number;
    total_actions: number;
}

export interface SpaceStatsData {
    total_members: number;
    dau: number;
    engagement_rate: number;
    posts_today: number;
    comments_today: number;
    likes_today: number;
    member_trend: number;
    activity_trend: number;
    demographics: SpaceDemographicItem[];
    daily_activity: SpaceDailyActivityItem[];
    recent_joined: SpaceRecentJoinedMember[];
    top_contributors: SpaceTopContributor[];
}

export interface SpacePost {
    id: number | string;
    [key: string]: unknown;
}

export interface SpaceUpdatePayload {
    name: string;
    description?: TipTapDoc | string | null;
    privacy_type: SpacePrivacy;
    avatar_file?: File | Blob | null;
    posting_rule?: SpacePostingRule;
    is_members_hidden?: boolean;
    links?: SpaceLink[] | null;
    rules?: TipTapDoc | string | null;
}

export interface UpdateMemberRolePayload {
    role: SpaceRole;
    custom_title: string | null;
}

export interface PaginatedData<T> {
    data: T[];
    meta?: PaginationMeta;
    total?: number;
}

export interface SpaceResponse {
    code: string;
    space?: SpaceData;
}

export interface SpacesListResponse {
    code: string;
    spaces: SpaceData[] | PaginatedData<SpaceData>;
    meta?: PaginationMeta;
}

export interface SpacePostsResponse {
    code: string;
    posts: SpacePost[] | PaginatedData<SpacePost>;
    meta?: PaginationMeta;
}

export interface SpaceMembersResponse {
    code: string;
    members: SpaceMemberItem[] | PaginatedData<SpaceMemberItem>;
    counts?: SpaceMemberCounts;
}

export interface SpaceInvitesResponse {
    code: string;
    invites?: SpaceInviteData[];
}

export interface SpaceInviteResponse {
    code: string;
    invite?: SpaceInviteData;
}

export interface SpaceStatsResponse {
    code: string;
    stats?: SpaceStatsData;
}

export interface SpaceActionResponse {
    code: string;
}