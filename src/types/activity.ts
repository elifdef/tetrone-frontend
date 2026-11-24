import type { PaginationMeta } from './api';
import type { SpacePost } from './space';
import type { TipTapDoc } from './tiptap';
import type { UserData, VerificationBadge } from './user';

export type ActivityTabKey = 'likes' | 'comments' | 'reposts' | 'voted-polls' | 'stats';

export interface ActivityCounts {
    likes: number;
    comments: number;
    reposts: number;
    voted_polls: number;
}

export interface ActivityAuthor {
    username: string;
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
    avatar?: string | null;
    is_verified?: boolean;
    verification_badge?: VerificationBadge | null;
    personalization?: {
        username_color?: string | null;
        banner_color?: string | null;
        banner_image?: string | null;
    } | null;
}

export interface ActivityCommentPostSummary {
    id: string | number;
    author_type?: string;
    author?: ActivityAuthor | null;
    user?: ActivityAuthor | null;
}

export interface ActivityComment {
    id: string;
    post_id: string;
    parent_id: string | null;
    content: TipTapDoc | Record<string, unknown> | string | null;
    created_at: string;
    user?: UserData | null;
    post?: ActivityCommentPostSummary | null;
    likes_count: number;
    is_liked: boolean;
}

export interface ScreenTimeHistoryEntry {
    date: string;
    seconds: number;
}

export interface ScreenTimeStats {
    total_active_seconds: number;
    history: ScreenTimeHistoryEntry[];
}

export interface ActivityCountsResponse {
    code: string;
    counts: ActivityCounts;
}

export interface ActivityPostsResponse {
    code: string;
    posts: SpacePost[];
    meta?: PaginationMeta;
}

export interface ActivityCommentsResponse {
    code: string;
    comments: ActivityComment[];
    meta?: PaginationMeta;
}

export interface ScreenTimeResponse {
    code: string;
    time: ScreenTimeStats;
}

export interface ScreenTimeSyncResponse {
    code: string;
}