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
    file_size?: number;
    status?: string;
    url: string | null;
    meta?: Record<string, unknown> | null;
    size?: number;
    rawFile?: File;
    previewUrl?: string;
}

export interface SharedEntityData {
    type: 'post' | 'comment' | 'user' | string;
    is_deleted?: boolean;
    post?: Record<string, unknown> | null;
    comment?: Record<string, unknown> | null;
    user?: UserData | null;
    id?: number | string | null;
    exists?: boolean;
    data?: Record<string, unknown> | null;
}

export interface ForwardedMessageData {
    uuid: string;
    author: UserData | null;
    sender_name: string;
    date: string;
    forwarded_from?: ForwardedMessageData | null;
}

export interface MessageReplyData {
    uuid: string;
    author: UserData | null;
    sender_name: string;
    date: string;
    text: TipTapDoc | string | null;
    files?: ChatAttachmentPreview[];
    shareable?: SharedEntityData | null;
    reply_to?: MessageReplyData | null;
}

export interface ChatMessageItem {
    uuid: string;
    text: TipTapDoc | string | null;
    reply_to?: MessageReplyData | null;
    files?: ChatAttachmentPreview[];
    shareable?: SharedEntityData | null;
    author?: UserData | null;
    author_type?: 'user' | 'group';
    isMine?: boolean;
    is_edited?: boolean;
    is_pinned?: boolean;
    is_important?: boolean;
    can_delete?: boolean;
    can_edit?: boolean;
    status?: 'sending' | 'sent' | 'read';
    read_at?: string | null;
    created_at: string;
    forwarded_from?: ForwardedMessageData | null;
    shared_post?: unknown;
    bundleUuids?: string[];
    isForwardBundle?: boolean;
    forwardedItems?: ChatMessageItem[];
    last_created_at?: string;
    isSameAuthor?: boolean;
}

export interface PendingForwardState {
    sourceChatSlug: string;
    messageUuids: string[];
    items: ChatMessageItem[];
}

export interface TypingUserInfo {
    username: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar?: string | null;
}

export interface ChatData {
    slug: string;
    is_saved: boolean;
    is_group: boolean;
    is_pinned: boolean;
    is_typing: boolean;
    typing_users: TypingUserInfo[];
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
    last_message_source_uuid?: string | null;
    last_message_reply_to?: MessageReplyData | null;
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

export interface ChatInitResponse {
    code: string;
    slug: string;
    chat: ChatData;
}

export interface ChatMessagesResponse {
    code: string;
    slug?: string;
    chat?: ChatData;
    messages: ChatMessageItem[];
    meta?: {
        current_page: number;
        has_more: boolean;
    };
}

export interface ChatMessageResponse {
    code: string;
    slug: string;
    uuid?: string;
    message: ChatMessageItem;
}

export interface ChatForwardResponse {
    code: string;
    target_slug: string;
    messages: ChatMessageItem[];
    message?: ChatMessageItem;
}

export interface ChatDeleteResponse {
    code: string;
    slug?: string;
    uuid?: string;
}

export interface ChatPinMessageResponse {
    code: string;
    slug: string;
    uuid: string;
    is_pinned: boolean;
}

export interface ChatImportantMessageResponse {
    code: string;
    slug: string;
    uuid: string;
    is_important: boolean;
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