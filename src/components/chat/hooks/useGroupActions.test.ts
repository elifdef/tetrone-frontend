import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroupActions } from './useGroupActions';
import chatService from '../../../services/chat.service';
import type { ChatData, GroupMemberInvitedResponse } from '@/types/chat';
import type { UserData } from '@/types/user';
import type { ApiRequestHandle } from '@/types/api';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../../../services/chat.service', () => ({
    default: {
        updateGroupInfo: vi.fn(),
        inviteGroupMember: vi.fn(),
        updateGroupMemberRole: vi.fn(),
        kickGroupMember: vi.fn(),
    },
}));

vi.mock('../../common/Notify.jsx', () => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
}));

const invitedUser: UserData = {
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

const initialChat: ChatData = {
    slug: 'gc-123',
    is_saved: false,
    is_group: true,
    is_pinned: false,
    is_typing: false,
    typing_users: [],
    muted_until: null,
    initiator_username: 'owner',
    target_user: null,
    title: null,
    description: null,
    avatar: null,
    participants_count: 1,
    owner_username: 'owner',
    participants: [
        {
            user: { ...invitedUser, username: 'owner', first_name: 'Owner' },
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

describe('useGroupActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('додає учасника до бесіди та оновлює participants_count після успішного запиту', () => {
        let chatsState: ChatData[] = [initialChat];
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

        const { result } = renderHook(() =>
            useGroupActions({ activeChatSlug: 'gc-123', setChats })
        );

        act(() => {
            result.current.handleInviteGroupMember('ivan_friend', invitedUser);
        });

        expect(chatService.inviteGroupMember).toHaveBeenCalledWith('gc-123', 'ivan_friend');
        expect(chatsState[0].participants_count).toBe(2);
        expect(chatsState[0].participants.some((p) => p.user?.username === 'ivan_friend')).toBe(true);
    });
});