import { useContext } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpaceProvider } from '@/context/SpaceContext';
import { SpaceContext } from '@/context/space-context';
import SpaceHeaderInfo from '@/components/spaces/SpaceHeaderInfo';
import SpaceRightSidebar from '@/components/spaces/SpaceRightSidebar';
import SpaceMembersTab from '@/components/spaces/SpaceMembersTab';
import SpaceInvitesTab from '@/components/spaces/SpaceInvitesTab';
import CreateSpaceModal from '@/components/spaces/CreateSpaceModal';
import SpacesPage from '@/pages/SpacesPage';
import SpaceService from '@/services/space.service';
import NotificationSettingsService from '@/services/notification.settings.service';
import type { SpaceData } from '@/types/space';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
    const actual = await vi.importActual<typeof import('react-router')>('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockT = (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key;
const mockI18n = { language: 'uk' };

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: mockI18n,
    }),
}));

vi.mock('@/components/common/Notify', () => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
}));

vi.mock('@/components/editor/SmartEditor', () => ({
    default: ({
        value,
        onChange,
        placeholder,
    }: {
        value?: unknown;
        onChange?: (doc: { type: 'doc'; content: unknown[] }) => void;
        placeholder?: string;
    }) => (
        <textarea
            data-testid="smart-editor"
            placeholder={placeholder}
            value={value ? JSON.stringify(value) : ''}
            onChange={(e) =>
                onChange?.({
                    type: 'doc',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: e.target.value }] }],
                })
            }
        />
    ),
}));

function mockApiCall<T>(result: T) {
    const handle = {
        onSuccess: (cb: (res: T) => void) => {
            cb(result);
            return handle;
        },
        onError: () => handle,
        onFinally: (cb: () => void) => {
            cb();
            return handle;
        },
    };
    return handle;
}

const baseSpace: SpaceData = {
    name: 'Retro Club',
    username: 'retro_club',
    aliases: null,
    description: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ласкаво просимо до клубу' }] }],
    },
    rules: null,
    links: [{ title: 'Wiki', url: 'https://example.com' }],
    privacy_type: 'public',
    posting_rule: 'all',
    is_members_hidden: false,
    avatar: '/retro.png',
    owner: {
        username: 'founder',
        first_name: 'Олексій',
        last_name: null,
        avatar: '/founder.png',
    },
    is_member: true,
    membership_status: 'approved',
    member_role: 'member',
    can_view_content: true,
    is_notifications_muted: false,
    members_count: 12,
    pending_requests_count: 0,
    preview_members: [
        {
            username: 'founder',
            first_name: 'Олексій',
            last_name: null,
            avatar: '/founder.png',
            role: 'owner',
            custom_title: 'Засновник',
        },
    ],
    created_at: '2026-01-01T00:00:00Z',
};

describe('Spaces module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    it('computes role permissions accurately in SpaceProvider', () => {
        const Inspector = () => {
            const ctx = useContext(SpaceContext);
            return (
                <div data-testid="perms">
                    {JSON.stringify({
                        isOwner: ctx.isOwner,
                        canManageSettings: ctx.canManageSettings,
                        canManageInvites: ctx.canManageInvites,
                        canManageMembers: ctx.canManageMembers,
                        canPost: ctx.canPost,
                    })}
                </div>
            );
        };

        const adminAdminOnlySpace: SpaceData = {
            ...baseSpace,
            member_role: 'admin',
            posting_rule: 'admins',
        };

        const { rerender } = render(
            <SpaceProvider initialSpace={adminAdminOnlySpace}>
                <Inspector />
            </SpaceProvider>
        );

        expect(JSON.parse(screen.getByTestId('perms').textContent || '{}')).toEqual({
            isOwner: false,
            canManageSettings: false,
            canManageInvites: true,
            canManageMembers: true,
            canPost: true,
        });

        rerender(
            <SpaceProvider initialSpace={{ ...adminAdminOnlySpace, member_role: 'member' }}>
                <Inspector />
            </SpaceProvider>
        );

        expect(JSON.parse(screen.getByTestId('perms').textContent || '{}')).toEqual({
            isOwner: false,
            canManageSettings: false,
            canManageInvites: false,
            canManageMembers: false,
            canPost: false,
        });
    });

    it('renders SpaceHeaderInfo with space metadata and rich description', () => {
        render(
            <MemoryRouter>
                <SpaceProvider initialSpace={baseSpace}>
                    <SpaceHeaderInfo />
                </SpaceProvider>
            </MemoryRouter>
        );

        expect(screen.getByText('Retro Club')).toBeTruthy();
        expect(screen.getByText('@retro_club')).toBeTruthy();
        expect(screen.getByText('spaces.privacy_public')).toBeTruthy();
        expect(screen.getByText('Олексій')).toBeTruthy();
        expect(screen.getByText('Ласкаво просимо до клубу')).toBeTruthy();
    });

    it('handles join and notification mute toggle in SpaceRightSidebar', () => {
        const joinSpy = vi
            .spyOn(SpaceService, 'joinSpace')
            .mockReturnValue(mockApiCall({ code: 'SPACE_JOINED' }) as never);
        const muteSpy = vi
            .spyOn(NotificationSettingsService, 'updateOverride')
            .mockReturnValue(mockApiCall({ code: 'OVERRIDES_UPDATED' }) as never);

        const outsiderSpace: SpaceData = {
            ...baseSpace,
            is_member: false,
            membership_status: null,
            member_role: null,
        };

        render(
            <MemoryRouter>
                <SpaceProvider initialSpace={outsiderSpace}>
                    <SpaceRightSidebar currentTab="wall" />
                </SpaceProvider>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('spaces.join'));
        expect(joinSpy).toHaveBeenCalledWith('retro_club');

        const muteBtn = screen.getByText('spaces.mute_notifications');
        fireEvent.click(muteBtn);
        expect(muteSpy).toHaveBeenCalledWith('retro_club', { is_muted: true }, 'space');
    });

    it('approves pending member requests in SpaceMembersTab', async () => {
        const ownerSpace: SpaceData = {
            ...baseSpace,
            privacy_type: 'private',
            member_role: 'owner',
            pending_requests_count: 1,
        };

        vi.spyOn(SpaceService, 'getSpaceMembers').mockImplementation((_username, params) => {
            if (params?.status === 'pending') {
                return mockApiCall({
                    code: 'OK',
                    members: [
                        {
                            role: 'member',
                            status: 'pending',
                            custom_title: null,
                            user: {
                                username: 'new_user',
                                first_name: 'Тарас',
                                last_name: null,
                                avatar: null,
                            },
                        },
                    ],
                    counts: { approved: 12, staff: 1, pending: 1 },
                }) as never;
            }
            return mockApiCall({
                code: 'OK',
                members: [],
                counts: { approved: 12, staff: 1, pending: 1 },
            }) as never;
        });

        const approveSpy = vi
            .spyOn(SpaceService, 'approveMember')
            .mockReturnValue(mockApiCall({ code: 'MEMBER_APPROVED' }) as never);

        render(
            <MemoryRouter>
                <SpaceProvider initialSpace={ownerSpace}>
                    <SpaceMembersTab />
                </SpaceProvider>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('spaces.members_requests'));

        await waitFor(() => {
            expect(screen.getByText('Тарас')).toBeTruthy();
        });

        fireEvent.click(screen.getByText('action.approve'));
        expect(approveSpy).toHaveBeenCalledWith('retro_club', 'new_user');
    });

    it('creates and revokes invites in SpaceInvitesTab', async () => {
        const adminSpace: SpaceData = {
            ...baseSpace,
            member_role: 'admin',
        };

        vi.spyOn(SpaceService, 'getInvites').mockReturnValue(
            mockApiCall({ code: 'OK', invites: [] }) as never
        );
        const createInviteSpy = vi.spyOn(SpaceService, 'createInvite').mockReturnValue(
            mockApiCall({
                code: 'INVITE_CREATED',
                invite: {
                    token: 'tok_123',
                    type: 'join',
                    rules: { note: 'Для друзів', auto_approve: true },
                    max_uses: 5,
                    uses_count: 0,
                    expires_at: null,
                    creator: { username: 'admin1', first_name: null, last_name: null, avatar: null },
                    target_user: null,
                    created_at: null,
                },
            }) as never
        );
        const revokeSpy = vi
            .spyOn(SpaceService, 'revokeInvite')
            .mockReturnValue(mockApiCall({ code: 'INVITE_REVOKED' }) as never);

        render(
            <MemoryRouter>
                <SpaceProvider initialSpace={adminSpace}>
                    <SpaceInvitesTab />
                </SpaceProvider>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('spaces.invite_note_placeholder'), {
            target: { value: 'Для друзів' },
        });
        fireEvent.click(screen.getByText('action.create'));

        expect(createInviteSpy).toHaveBeenCalledWith('retro_club', {
            rules: { note: 'Для друзів' },
        });

        await waitFor(() => {
            expect(screen.getByText('Для друзів')).toBeTruthy();
        });

        fireEvent.click(screen.getByText('action.delete'));
        expect(revokeSpy).toHaveBeenCalledWith('retro_club', 'tok_123');
    });

    it('sanitizes username and submits FormData in CreateSpaceModal', () => {
        const queryClient = new QueryClient();
        const onClose = vi.fn();
        const createSpy = vi.spyOn(SpaceService, 'createSpace').mockReturnValue(
            mockApiCall({
                code: 'SPACE_CREATED',
                space: { ...baseSpace, username: 'my_new_space' },
            }) as never
        );

        const { container } = render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <CreateSpaceModal onClose={onClose} />
                </MemoryRouter>
            </QueryClientProvider>
        );

        const textInputs = container.querySelectorAll('input:not([type="file"])');
        fireEvent.change(textInputs[0], { target: { value: 'My New Space' } });
        fireEvent.change(textInputs[1], { target: { value: 'My-New@Space_1!' } });

        expect((textInputs[1] as HTMLInputElement).value).toBe('mynewspace_1');

        fireEvent.click(screen.getByText('action.create'));

        expect(createSpy).toHaveBeenCalledTimes(1);
        const submittedFormData = createSpy.mock.calls[0][0] as FormData;
        expect(submittedFormData.get('name')).toBe('My New Space');
        expect(submittedFormData.get('username')).toBe('mynewspace_1');
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/my_new_space');
    });

    it('lists spaces and supports search and leave on SpacesPage', async () => {
        vi.spyOn(SpaceService, 'getSpacesList').mockReturnValue(
            mockApiCall({
                code: 'OK',
                spaces: [baseSpace],
                meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
            }) as never
        );
        const leaveSpy = vi
            .spyOn(SpaceService, 'leaveSpace')
            .mockReturnValue(mockApiCall({ code: 'SPACE_LEFT' }) as never);

        render(
            <MemoryRouter>
                <SpacesPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Retro Club')).toBeTruthy();
        });

        fireEvent.click(screen.getByText('spaces.leave'));
        expect(leaveSpy).toHaveBeenCalledWith('retro_club');
    });
});