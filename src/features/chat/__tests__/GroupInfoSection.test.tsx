import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import GroupInfoSection from '../components/modals/info/GroupInfoSection';
import userService from '@/services/user.service';
import type { ChatData } from '@/types/chat';
import type { UserData } from '@/types/user';
import type { ApiRequestHandle } from '@/types/api';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('@components/editor/SmartEditor', () => ({
    default: () => <div data-testid="smart-editor" />,
}));

vi.mock('@common/RichText', () => ({
    default: () => <span data-testid="rich-text" />,
}));

vi.mock('@/services/user.service', () => ({
    default: {
        searchUsers: vi.fn(),
    },
}));

const createUser = (overrides: Partial<UserData> & { username: string }): UserData => ({
    aliases: null,
    first_name: 'Test',
    last_name: 'User',
    avatar: null,
    gender: 1,
    is_setup_complete: true,
    is_banned: false,
    is_deleted: false,
    is_verified: false,
    verification_badge: null,
    personalization: null,
    ...overrides,
});

const ownerUser = createUser({ username: 'owner_user', first_name: 'Олег', last_name: 'Адмін' });
const friendOne = createUser({ username: 'friend_one', first_name: 'Іван', last_name: 'Друг' });
const strangerTwo = createUser({ username: 'stranger_two', first_name: 'Марія', last_name: 'Нова' });

const baseGroupChat: ChatData = {
    slug: 'group-slug-1',
    is_saved: false,
    is_group: true,
    is_pinned: false,
    is_typing: false,
    typing_users: [],
    muted_until: null,
    initiator_username: 'owner_user',
    target_user: null,
    title: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Тест бесіда' }] }] },
    description: null,
    avatar: null,
    participants_count: 1,
    owner_username: 'owner_user',
    participants: [{ user: ownerUser, role: 'owner' }],
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
    created_at: '2026-11-23T10:00:00Z',
    updated_at: '2026-11-23T10:00:00Z',
};

describe('GroupInfoSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає друга без поля id та дозволяє запросити його в бесіду за username', () => {
        const onInviteMember = vi.fn();

        render(
            <MemoryRouter>
                <GroupInfoSection
                    chat={baseGroupChat}
                    currentUser={ownerUser}
                    friendsList={[friendOne]}
                    onInviteMember={onInviteMember}
                />
            </MemoryRouter>
        );

        const select = screen.getByLabelText('chat.modals.select_friend') as HTMLSelectElement;
        expect(select).toBeInTheDocument();
        expect(screen.getByText(/Іван Друг \(@friend_one\)/)).toBeInTheDocument();

        fireEvent.change(select, { target: { value: 'friend_one' } });
        fireEvent.click(screen.getByText('chat.info_modal.invite'));

        expect(onInviteMember).toHaveBeenCalledTimes(1);
        expect(onInviteMember).toHaveBeenCalledWith('friend_one', friendOne);
    });

    it('виключає друга зі списку доступних до запрошення, якщо він уже є учасником бесіди', () => {
        const chatWithFriend: ChatData = {
            ...baseGroupChat,
            participants_count: 2,
            participants: [
                { user: ownerUser, role: 'owner' },
                { user: friendOne, role: 'member' },
            ],
        };

        render(
            <MemoryRouter>
                <GroupInfoSection
                    chat={chatWithFriend}
                    currentUser={ownerUser}
                    friendsList={[friendOne]}
                />
            </MemoryRouter>
        );

        expect(screen.queryByLabelText('chat.modals.select_friend')).not.toBeInTheDocument();
    });

    it('дозволяє знайти користувача через пошук і додати його в бесіду', async () => {
        const onInviteMember = vi.fn();
        const mockHandle: ApiRequestHandle<{ code: string; users: UserData[] }> = {
            onSuccess(cb) {
                cb({ code: 'USERS_RETRIEVED', users: [strangerTwo], status: 200, ok: true });
                return mockHandle;
            },
            onError() {
                return mockHandle;
            },
            onFinally(cb) {
                cb();
                return mockHandle;
            },
            then: vi.fn(),
            catch: vi.fn(),
        };

        vi.mocked(userService.searchUsers).mockReturnValue(mockHandle);

        render(
            <MemoryRouter>
                <GroupInfoSection
                    chat={baseGroupChat}
                    currentUser={ownerUser}
                    friendsList={[]}
                    onInviteMember={onInviteMember}
                />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('chat.info_modal.add_member'));

        const searchInput = screen.getByPlaceholderText('chat.modals.search_users_placeholder');
        fireEvent.change(searchInput, { target: { value: 'stranger' } });

        await waitFor(() => {
            expect(userService.searchUsers).toHaveBeenCalledWith('stranger');
        });

        expect(screen.getByText('@stranger_two')).toBeInTheDocument();
        fireEvent.click(screen.getByText('chat.info_modal.invite'));

        expect(onInviteMember).toHaveBeenCalledWith('stranger_two', strangerTwo);
    });

    it('ховає керування учасниками для звичайного учасника (member)', () => {
        const memberChat: ChatData = {
            ...baseGroupChat,
            participants_count: 2,
            participants: [
                { user: ownerUser, role: 'owner' },
                { user: friendOne, role: 'member' },
            ],
        };

        render(
            <MemoryRouter>
                <GroupInfoSection
                    chat={memberChat}
                    currentUser={friendOne}
                    friendsList={[strangerTwo]}
                />
            </MemoryRouter>
        );

        expect(screen.queryByText('chat.info_modal.add_member')).not.toBeInTheDocument();
        expect(screen.queryByText('chat.info_modal.kick')).not.toBeInTheDocument();
    });
});