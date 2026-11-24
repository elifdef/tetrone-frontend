import type { ChatAttachmentPreview } from '@/types/chat';

export interface FlattenedChatFile extends Omit<ChatAttachmentPreview, 'url'> {
    url: string;
    messageId: string;
    createdAt: string;
}

export interface ExtractedChatLink {
    url: string;
    text?: string;
    messageId: string;
    createdAt: string;
}