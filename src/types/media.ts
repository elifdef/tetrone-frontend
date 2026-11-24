export type MediaCategory = 'image' | 'video' | 'audio' | 'document';

export interface AttachmentItem {
    id?: number | string;
    type: MediaCategory | string;
    url?: string | null;
    file_url?: string | null;
    name?: string;
    file_name?: string;
    original_name?: string;
    mime_type?: string;
    size?: number;
    status?: 'processing' | 'ready' | 'failed' | string;
    meta?: Record<string, unknown> | null;
}

export interface AudioSourceInfo {
    type: string;
    id: number | string;
    url: string;
}

export interface AudioTrackItem {
    id: number | string;
    title?: string;
    artist?: string;
    url?: string | null;
    file_url?: string | null;
    duration?: number;
    post_id?: number | string;
    sourceInfo?: AudioSourceInfo | null;
}