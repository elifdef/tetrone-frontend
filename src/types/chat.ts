import type { TipTapDoc, UserData } from './user';

export type ChatRoleValue = 'owner' | 'admin' | 'member';

export interface ChatParticipantData {
    user: UserData | null;
    role: ChatRoleValue;
}

export interface ChatAttachmentPreview {
    id?: number;
    name: string;
    type: string;
    url: string | null;
    size?: number;
}

export interface SharedEntityData {
    type: string;
    id: number | string | null;
    exists: boolean;
    data: Record<string, unknown> | null;
}

export interface ChatMessageItem {
    uuid: string;
    text: TipTapDoc | string | null;
    files?: ChatAttachmentPreview[];
    shareable?: SharedEntityData | null;
    author?: UserData | null;
    author_type?: 'user' | 'group';
    isMine?: boolean;
    is_pinned?: boolean;
    is_important?: boolean;
    can_delete?: boolean;
    can_edit?: boolean;
    status?: 'sent' | 'read';
    read_at?: string | null;
    created_at: string;
    bundleUuids?: string[];
}

export interface ChatData {
    slug: string;
    is_saved: boolean;
    is_group: boolean;
    is_pinned: boolean;
    is_typing: boolean;
    typing_users: string[];
    muted_until: string | null;
    initiator_username: string;
    target_user: UserData | null;
    title: TipTapDoc | null;
    description: TipTapDoc | null;
    avatar: string | null;
    participants_count: number;
    owner_username: string | null;
    participants: ChatParticipantData[];
    last_message: TipTapDoc | null;
    last_message_files: ChatAttachmentPreview[];
    last_message_shareable: SharedEntityData | null;
    last_message_is_forward: boolean;
    last_message_sender_username: string | null;
    last_message_author_type: 'user' | 'group';
    last_message_author: UserData | null;
    is_last_unread: boolean;
    unread_count: number;
    can_send_message: boolean;
    is_blocked?: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface ChatListResponse {
    code: string;
    chats: ChatData[];
}

export interface ChatMessagesResponse {
    code: string;
    chat?: ChatData;
    messages: ChatMessageItem[];
}

export interface GroupInfoUpdatedResponse {
    code: string;
    slug: string;
    chat: ChatData;
}

export interface GroupMemberInvitedResponse {
    code: string;
    slug: string;
    username: string;
    chat?: ChatData;
}

export interface GroupMemberRoleUpdatedResponse {
    code: string;
    slug: string;
    username: string;
    role: ChatRoleValue;
}

export interface GroupMemberKickedResponse {
    code: string;
    slug: string;
    username: string;
}