export interface NotificationActor {
    id?: number;
    username?: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar?: string | null;
    gender?: number | null;
}

export interface NotificationTarget {
    target_id?: number | string;
    sub_target_id?: number | string;
    post_author_id?: number;
    preview_text?: string | null;
    attachment_type?: 'video' | 'image' | 'audio' | 'document' | 'poll' | string | null;
    attachment_name?: string | null;
    has_media?: boolean;
    media_preview?: string | null;
    ticket_id?: number | string;
    message_id?: number | string;
    ticket_date?: string | null;
}

export interface NotificationPayload {
    space_name?: string;
    space_username?: string;
    post_id?: number | string;
    new_role?: string;
    [key: string]: unknown;
}

export interface NotificationDisplayConfig {
    actionText: string;
    linkText: string | null;
    linkUrl: string | null;
    snippetText: string | null;
    mediaPreview: string | null;
    mediaPosition: 'left' | 'right';
    isReaction?: boolean;
}