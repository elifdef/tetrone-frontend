import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { useGroupActions } from '../components/hooks/useGroupActions';
import { useChatDrafts } from '../components/hooks/useChatDrafts';
import { useLocalMessageSearch } from '../components/hooks/useLocalMessageSearch';
import { getAttachmentBadges, getSenderPrefix } from '../components/utils/chatBadges';
import { getChatPlainShortTitle, getTypingText } from '../components/utils/chatHelpers';
import { groupMessagesByDay } from '../components/utils/messageGrouper';
import { getPlainText, hasRichContent, detectTipTapFeatures, toTipTapDoc } from '../components/utils/messageParser';
import chatService from '@/services/chat.service';
import type { ChatData, ChatMessageItem, GroupMemberInvitedResponse } from '@/types/chat';
import type { UserData } from '@/types/user';
import type { ApiRequestHandle } from '@/types/api';
import type { TipTapDoc } from '@/types/tiptap';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('@/services/chat.service', () => ({
    default: {
        updateGroupInfo: vi.fn(),
        inviteGroupMember: vi.fn(),
        updateGroupMemberRole: vi.fn(),
        kickGroupMember: vi.fn(),
    },
}));

vi.mock('@/components/common/Notify', () => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
}));

const tMock = ((key: string, opts?: Record<string, unknown>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key) as unknown as TFunction;

const baseUser: UserData = {
    username: 'ivan_friend',
    aliases: null,
    first_name: 'Іван',
    last_name: 'Друг',
    avatar: null,
    gender: 1,
    is_setup_complete: true,
    is_banned: false,
    is_deleted: false,
    is_verified: false,
    verification_badge: null,
    personalization: null,
};

const baseChat: ChatData = {
    slug: 'gc-123',
    is_saved: false,
    is_group: true,
    is_pinned: false,
    is_typing: false,
    typing_users: [],
    muted_until: null,
    initiator_username: 'owner',
    target_user: null,
    title: toTipTapDoc('Робоча група'),
    description: null,
    avatar: null,
    participants_count: 1,
    owner_username: 'owner',
    participants: [
        {
            user: { ...baseUser, username: 'owner', first_name: 'Owner' },
            role: 'owner',
        },
    ],
    last_message: null,
    last_message_files: [],
    last_message_shareable: null,
    last_message_is_forward: false,
    last_message_sender_username: null,
    last_message_author_type: 'user',
    last_message_author: null,
    is_last_unread: false,
    unread_count: 0,
    can_send_message: true,
    created_at: null,
    updated_at: null,
};

describe('Chat utils & hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('парсить TipTap-документи та визначає спецблоки', () => {
       const doc: TipTapDoc = {
            type: 'doc',
            content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Привіт світ' }] },
                { type: 'codeBlock', content: [] },
            ],
        };

        expect(getPlainText(doc)).toBe('Привіт світ');
        expect(hasRichContent(doc)).toBe(true);
        expect(detectTipTapFeatures(doc)).toEqual({
            hasTable: false,
            hasCode: true,
            hasTask: false,
            hasDetails: false,
        });
    });

    it('формує бейджі вкладень, репостів і префікси відправника', () => {
        const chatWithPost: ChatData = {
            ...baseChat,
            last_message_shareable: {
                type: 'post',
                post: { poll: { id: 1 } },
            },
            last_message_author_type: 'group',
        };

        const badges = getAttachmentBadges(chatWithPost, null, [], tMock);
        expect(badges.map((b) => b.key)).toEqual(['share_post', 'poll']);
        expect(getSenderPrefix(chatWithPost, baseUser, tMock)).toBe('Робоча група:');
        expect(getChatPlainShortTitle(chatWithPost, tMock)).toBe('Робоча група');
    });

    it('формує текст індикатора набору тексту в груповому та приватному чаті', () => {
        const typingGroup: ChatData = {
            ...baseChat,
            typing_users: [
                { username: 'u1', first_name: 'Олена' },
                { username: 'u2', first_name: 'Тарас' },
            ],
        };

        expect(getTypingText(typingGroup, baseUser, tMock)).toContain('chat.typing_two');
    });

    it('групує повідомлення по днях і обʼєднує послідовні переслані повідомлення в бандл', () => {
        const messages: ChatMessageItem[] = [
            {
                uuid: 'm1',
                text: toTipTapDoc('Перше'),
                created_at: '2026-11-24T10:00:00.000Z',
                isMine: true,
                author: baseUser,
                forwarded_from: {
                    uuid: 'src-1',
                    author: baseUser,
                    sender_name: 'Іван Друг',
                    date: '09:50',
                },
            },
            {
                uuid: 'm2',
                text: toTipTapDoc('Друге'),
                created_at: '2026-11-24T10:00:02.000Z',
                isMine: true,
                author: baseUser,
                forwarded_from: {
                    uuid: 'src-2',
                    author: baseUser,
                    sender_name: 'Іван Друг',
                    date: '09:51',
                },
            },
        ];

        const groups = groupMessagesByDay(messages, baseUser, baseChat, 'uk-UA');
        expect(groups).toHaveLength(1);
        expect(groups[0].items).toHaveLength(1);
        expect(groups[0].items[0].isForwardBundle).toBe(true);
        expect(groups[0].items[0].bundleUuids).toEqual(['m1', 'm2']);
    });

    it('ізолює чернетки тексту та файлів між різними чатами у useChatDrafts', () => {
        const { result, rerender } = renderHook(({ slug }) => useChatDrafts(slug), {
            initialProps: { slug: 'dm-1' as string | null },
        });

        act(() => {
            result.current.setText('Чернетка для першого чату');
            result.current.handleAddGraffitiFile('data:image/png;base64,AAA');
        });

        expect(result.current.text).toBe('Чернетка для першого чату');
        expect(result.current.files).toHaveLength(1);

        rerender({ slug: 'dm-2' });
        expect(result.current.text).toBeNull();
        expect(result.current.files).toHaveLength(0);

        rerender({ slug: 'dm-1' });
        expect(result.current.text).toBe('Чернетка для першого чату');
        expect(result.current.files).toHaveLength(1);
    });

    it('фільтрує повідомлення за текстом, цитатою та назвою вкладення у useLocalMessageSearch', () => {
        const items: ChatMessageItem[] = [
            {
                uuid: '1',
                text: toTipTapDoc('Звичайне привітання'),
                created_at: '2026-11-24T10:00:00.000Z',
            },
            {
                uuid: '2',
                text: toTipTapDoc('Документ у вкладенні'),
                files: [{ name: 'contract_2026.pdf', type: 'application/pdf', url: '/file.pdf' }],
                created_at: '2026-11-24T10:01:00.000Z',
            },
        ];

        const { result } = renderHook(() => useLocalMessageSearch(items));

        act(() => {
            result.current.setMessageSearchQuery('contract_2026');
        });

        expect(result.current.filteredMessages).toHaveLength(1);
        expect(result.current.filteredMessages[0].uuid).toBe('2');
    });

    it('додає учасника до бесіди та оновлює participants_count у useGroupActions', () => {
        let chatsState: ChatData[] = [baseChat];
        const setChats = vi.fn((updater: ChatData[] | ((prev: ChatData[]) => ChatData[])) => {
            chatsState = typeof updater === 'function' ? updater(chatsState) : updater;
        });

        const mockHandle: ApiRequestHandle<GroupMemberInvitedResponse> = {
            onSuccess(cb) {
                cb({
                    code: 'GROUP_MEMBER_INVITED',
                    slug: 'gc-123',
                    username: 'ivan_friend',
                    status: 200,
                    ok: true,
                });
                return mockHandle;
            },
            onError() {
                return mockHandle;
            },
            onFinally() {
                return mockHandle;
            },
            then: vi.fn(),
            catch: vi.fn(),
        };

        vi.mocked(chatService.inviteGroupMember).mockReturnValue(mockHandle);

        const { result } = renderHook(() => useGroupActions({ activeChatSlug: 'gc-123', setChats }));

        act(() => {
            result.current.handleInviteGroupMember('ivan_friend', baseUser);
        });

        expect(chatService.inviteGroupMember).toHaveBeenCalledWith('gc-123', 'ivan_friend');
        expect(chatsState[0].participants_count).toBe(2);
        expect(chatsState[0].participants.some((p) => p.user?.username === 'ivan_friend')).toBe(true);
    });
});