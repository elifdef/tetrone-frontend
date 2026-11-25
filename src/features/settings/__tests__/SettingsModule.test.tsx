import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import SettingsPage from '@/pages/SettingsPage';
import UserService from '@/services/user.service';
import PersonalizationService from '@/services/personalization.service';
import NotificationSettingsService from '@/services/notification.settings.service';
import PrivacyService from '@/services/privacy.service';
import AuthService from '@/services/auth.service';
import { AuthContext } from '@/context/AuthContext';
import { ModalContext, type ModalContextValue } from '@/app/providers/modal-context';
import type { ApiErrorResponse, ApiRequestHandle, ApiResponse } from '@/types/api';
import type { UserData } from '@/types/user';

const mockT = (key: string) => key;
const mockI18n = { language: 'uk' };

vi.mock('react-i18next', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-i18next')>();
    return {
        ...actual,
        useTranslation: () => ({
            t: mockT,
            i18n: mockI18n,
        }),
    };
});

vi.mock('@/hooks/usePageTitle', () => ({
    usePageTitle: vi.fn(),
}));

vi.mock('@/hooks/useDateFormatter', () => ({
    useDateFormatter: () => (date: string) => date,
}));

vi.mock('@/components/common/Notify', () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyInfo: vi.fn(),
    notifyLoading: vi.fn(() => 'toast-1'),
    dismissToast: vi.fn(),
}));

vi.mock('@/context/ThemeContext', () => ({
    useTheme: () => ({
        theme: { siteTheme: 'classic', profileTheme: 'classic', isDark: false },
        toggleDark: vi.fn(),
        changeSiteTheme: vi.fn(),
        changeProfileTheme: vi.fn(),
    }),
}));

vi.mock('@/components/profile/UserProfileCard', () => ({
    default: ({ currentUser }: { currentUser: UserData | null }) => (
        <div data-testid="profile-preview">{currentUser?.first_name}</div>
    ),
}));

vi.mock('@/components/editor/SmartEditor', () => ({
    default: () => <div data-testid="smart-editor" />,
}));

vi.mock('@/components/editor/StickerPicker', () => ({
    default: ({ onSelect }: { onSelect: (s: { id: number; url: string }) => void }) => (
        <button
            type="button"
            onClick={() => onSelect({ id: 77, url: '/storage/stickers/77.png' })}
        >
            pick-sticker-77
        </button>
    ),
}));

vi.mock('@/components/ui/CustomSelect', () => ({
    default: ({
        options,
        value,
        onChange,
    }: {
        options: Array<{ value: string | number; label: string }>;
        value?: string | number;
        onChange: (val: string | number) => void;
    }) => (
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
}));

function mockHandle<T extends object>(data: T, isError = false): ApiRequestHandle<T> {
    const response = {
        ...data,
        status: isError ? 400 : 200,
        ok: !isError,
    } as ApiResponse<T>;

    const handle: ApiRequestHandle<T> = {
        onSuccess(cb) {
            if (!isError) cb(response);
            return handle;
        },
        onError(cb) {
            if (isError) cb(response as unknown as ApiErrorResponse);
            return handle;
        },
        onFinally(cb) {
            cb();
            return handle;
        },
        then(onfulfilled, onrejected) {
            return Promise.resolve(response).then(onfulfilled, onrejected);
        },
        catch(onrejected) {
            return Promise.resolve(response).catch(onrejected);
        },
    };

    return handle;
}

const baseUser: UserData = {
    id: 1,
    username: 'taras_dev',
    email: 'taras@example.com',
    first_name: 'Тарас',
    last_name: 'Шевченко',
    avatar: null,
    gender: 1,
    birth_date: '1999-03-09',
    birth_date_changed_at: null,
    country: 'UA',
    bio: null,
    is_setup_complete: true,
    is_banned: false,
    is_deleted: false,
    is_verified: true,
    verification_badge: {
        type: 'classic',
        sticker_id: null,
        sticker_url: null,
    },
    personalization: {
        banner_color: '#112233',
        username_color: 'rgb(10, 20, 30)',
        banner_image: null,
    },
    notification_settings: {
        messages: { is_enabled: true, sound_id: 5 },
        likes: { is_enabled: true, sound_id: 1 },
        comments: { is_enabled: true, sound_id: 2 },
        reposts: { is_enabled: true, sound_id: 3 },
        wall_posts: { is_enabled: true, sound_id: 6 },
        friend_requests: { is_enabled: true, sound_id: 4 },
        space_posts: { is_enabled: true, sound_id: 7 },
    },
};

const defaultModalValue: ModalContextValue = {
    openConfirm: vi.fn().mockResolvedValue(true),
    openPrompt: vi.fn().mockResolvedValue(null),
    openPassword: vi.fn().mockResolvedValue(null),
    openCustom: vi.fn().mockResolvedValue(undefined),
    closeModal: vi.fn(),
};

function renderSettings(initialEntry = '/settings', userOverride: Partial<UserData> = {}) {
    const user: UserData = { ...baseUser, ...userOverride };
    const setUser = vi.fn();

    return {
        setUser,
        ...render(
            <AuthContext.Provider
                value={{
                    user,
                    setUser,
                    loading: false,
                    login: vi.fn(),
                    logout: vi.fn(),
                } as never}
            >
                <ModalContext.Provider value={defaultModalValue}>
                    <MemoryRouter initialEntries={[initialEntry]}>
                        <Routes>
                            <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                    </MemoryRouter>
                </ModalContext.Provider>
            </AuthContext.Provider>
        ),
    };
}

describe('Settings Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date('2026-11-25T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sends ONLY changed fields when updating profile (partial update)', async () => {
        const updateSpy = vi
            .spyOn(UserService, 'updateProfile')
            .mockReturnValue(mockHandle({ code: 'PROFILE_UPDATED' }));

        renderSettings('/settings?act=profile');

        // Перемикаємо лише стать на Жіночу (value="2")
        const femaleRadio = screen.getByLabelText('common.female');
        fireEvent.click(femaleRadio);

        const saveBtn = screen.getByRole('button', { name: 'action.save' });
        expect(saveBtn).not.toBeDisabled();
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(updateSpy).toHaveBeenCalledTimes(1);
            expect(updateSpy).toHaveBeenCalledWith('taras_dev', { gender: 2 });
        });
    });

    it('does not show min-length error while typing 1st character, highlights only after blur', () => {
        renderSettings('/settings?act=profile');

        const firstNameInput = screen.getByDisplayValue('Тарас');

        // Вводимо 1 символ — помилка ще НЕ повинна підсвічуватися до blur
        fireEvent.change(firstNameInput, { target: { value: 'А' } });
        expect(screen.queryByText('errors.min_length')).not.toBeInTheDocument();

        // Втрата фокусу (onBlur) -> тепер помилка з'являється
        fireEvent.blur(firstNameInput);
        expect(screen.getByText('errors.min_length')).toBeInTheDocument();

        // Вводимо 3 символи -> помилка одразу зникає
        fireEvent.change(firstNameInput, { target: { value: 'Антон' } });
        expect(screen.queryByText('errors.min_length')).not.toBeInTheDocument();
    });

    it('locks birthday field when today is not birthday and unlocks it on birthday', () => {
        // Сьогодні 2026-11-25, а ДН 1999-03-09 -> заблоковано
        const { unmount } = renderSettings('/settings?act=profile');

        const birthdayInput = screen.getByDisplayValue('09.03.1999');
        expect(birthdayInput).toBeDisabled();
        expect(screen.getByText('settings.birth_date_birthday_only_hint')).toBeInTheDocument();
        unmount();

        // Встановлюємо дату сьогодні = 9 березня -> поле розблоковане
        vi.setSystemTime(new Date('2026-03-09T10:00:00Z'));
        renderSettings('/settings?act=profile');

        const unlockedBirthdayInput = screen.getByDisplayValue('09.03.1999');
        expect(unlockedBirthdayInput).not.toBeDisabled();
    });

    it('sends ONLY changed personalization fields (e.g. verification sticker)', async () => {
        const updatePersonalizationSpy = vi
            .spyOn(PersonalizationService, 'updateSettings')
            .mockReturnValue(
                mockHandle({
                    code: 'PERSONALIZATION_UPDATED',
                    personalization: baseUser.personalization!,
                    verification_badge: {
                        type: 'sticker',
                        sticker_id: 77,
                        sticker_url: '/storage/stickers/77.png',
                    },
                })
            );

        renderSettings('/settings?act=personalization');

        fireEvent.click(screen.getByLabelText('settings.badge_sticker'));
        fireEvent.click(screen.getByRole('button', { name: 'settings.select_saved_sticker' }));
        fireEvent.click(screen.getByText('pick-sticker-77'));

        fireEvent.click(screen.getByRole('button', { name: 'action.save' }));

        await waitFor(() => {
            expect(updatePersonalizationSpy).toHaveBeenCalledTimes(1);
            expect(updatePersonalizationSpy).toHaveBeenCalledWith({
                verification_badge_type: 'sticker',
                verification_sticker_id: 77,
            });
        });
    });

    it('sends ONLY changed notification types', async () => {
        const updateNotifySpy = vi
            .spyOn(NotificationSettingsService, 'updateSettings')
            .mockReturnValue(
                mockHandle({
                    code: 'SETTINGS_UPDATED',
                    settings: {
                        ...baseUser.notification_settings!,
                        likes: { is_enabled: false, sound_id: 1 },
                    } as never,
                })
            );

        renderSettings('/settings?act=notifications');

        const likesCheckbox = screen.getByLabelText('settings.notification_likes');
        fireEvent.click(likesCheckbox);

        fireEvent.click(screen.getByRole('button', { name: 'action.save' }));

        await waitFor(() => {
            expect(updateNotifySpy).toHaveBeenCalledTimes(1);
            expect(updateNotifySpy).toHaveBeenCalledWith({
                settings: [{ type: 'likes', is_enabled: false, sound_id: 1 }],
            });
        });
    });

    it('sends ONLY changed privacy contexts in a single PATCH request', async () => {
        vi.spyOn(PrivacyService, 'getSettings').mockReturnValue(
            mockHandle({
                code: 'PRIVACY_SETTINGS_RETRIEVED',
                privacy: {
                    settings: {
                        profile: 0,
                        avatar: 0,
                        dob: 0,
                        country: 0,
                        friends: 0,
                        message: 0,
                        wall_post: 1,
                        comment: 0,
                        poll_vote: 1,
                        reaction: 0,
                    },
                    exceptions: [],
                },
            })
        );

        const updatePrivacySpy = vi
            .spyOn(PrivacyService, 'updateSettings')
            .mockReturnValue(
                mockHandle({
                    code: 'PRIVACY_SETTING_UPDATED',
                    settings: {} as never,
                })
            );

        renderSettings('/settings?act=privacy');

        const selects = await screen.findAllByRole('combobox');
        // Змінюємо лише другий селект (avatar) на level 2 (Nobody)
        fireEvent.change(selects[1], { target: { value: '2' } });

        fireEvent.click(screen.getByRole('button', { name: 'action.save' }));

        await waitFor(() => {
            expect(updatePrivacySpy).toHaveBeenCalledTimes(1);
            expect(updatePrivacySpy).toHaveBeenCalledWith({ avatar: 2 });
        });
    });

    it('renders sessions without raw auth_token title and separates API tokens', async () => {
        vi.spyOn(AuthService, 'getSessions').mockReturnValue(
            mockHandle({
                code: 'SESSIONS_RETRIEVED',
                sessions: [
                    {
                        id: 1,
                        name: 'auth_token',
                        ip_address: '192.168.1.10',
                        location: 'Ukraine, Kyiv',
                        device: {
                            client_type: 'Desktop Web',
                            browser: 'Chrome',
                            browser_version: '130.0',
                            os: 'Windows',
                            os_version: '10',
                            is_robot: false,
                            raw_user_agent:
                                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
                        },
                        last_used_at: '2026-11-25T11:55:00Z',
                        created_at: '2026-11-20T10:00:00Z',
                        is_current: true,
                        is_api_token: false,
                    },
                    {
                        id: 2,
                        name: 'Deploy Bot',
                        ip_address: '10.0.0.5',
                        location: 'Localhost',
                        device: {
                            client_type: 'Unknown Application',
                            browser: 'Unknown',
                            browser_version: 'Unknown',
                            os: 'Unknown',
                            os_version: 'Unknown',
                            is_robot: false,
                            raw_user_agent: null,
                        },
                        last_used_at: null,
                        created_at: '2026-11-21T10:00:00Z',
                        is_current: false,
                        is_api_token: true,
                    },
                ],
            })
        );

        renderSettings('/settings?act=sessions');

        expect(await screen.findByText('Chrome • Windows')).toBeInTheDocument();
        expect(screen.queryByText('auth_token')).not.toBeInTheDocument();
        expect(screen.getByText('Deploy Bot')).toBeInTheDocument();
    });
});