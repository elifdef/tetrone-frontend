import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { BannedScreen } from '../components/BannedScreen';
import AuthService from '@/services/auth.service';
import AppealService from '@/services/appeal.service';
import { AuthContext } from '@/context/AuthContext';
import type { ApiRequestHandle, ApiResponse } from '@/types/api';
import type { UserData } from '@/types/user';

vi.mock('react-i18next', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-i18next')>();
    return {
        ...actual,
        useTranslation: () => ({ t: (k: string) => k }),
    };
});

vi.mock('@/components/common/Notify', () => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
}));

function mockHandle<T extends object>(data: T, status = 200): ApiRequestHandle<T> {
    const ok = status >= 200 && status < 300;
    const response = { ...data, status, ok } as ApiResponse<T>;
    const handle: ApiRequestHandle<T> = {
        onSuccess(cb) {
            if (ok) cb(response);
            return handle;
        },
        onError(cb) {
            if (!ok) cb(response as never);
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

describe('ForgotPasswordForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('walks through email, 6-digit code verification, and password reset steps', async () => {
        const forgotSpy = vi
            .spyOn(AuthService, 'forgotPassword')
            .mockReturnValue(mockHandle({ code: 'RESET_CODE_SENT' }));
        const verifySpy = vi
            .spyOn(AuthService, 'verifyResetCode')
            .mockReturnValue(mockHandle({ code: 'CODE_VERIFIED' }));
        const resetSpy = vi
            .spyOn(AuthService, 'resetPassword')
            .mockReturnValue(mockHandle({ code: 'PASSWORD_RESET_SUCCESS' }));

        render(
            <MemoryRouter>
                <ForgotPasswordForm />
            </MemoryRouter>
        );

        // Крок 1: введення email
        fireEvent.change(screen.getByLabelText('auth.email'), {
            target: { value: 'taras@tetrone.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'action.get_code' }));

        await waitFor(() => {
            expect(forgotSpy).toHaveBeenCalledWith('taras@tetrone.com');
        });

        // Крок 2: вставка 6-значного коду (чекаємо рендеру першого інпута 2-го кроку)
        const firstCodeInput = await screen.findByLabelText('auth.confirmation_code 1');
        const codeInputs = screen.getAllByRole('textbox');
        expect(codeInputs).toHaveLength(6);
        expect(firstCodeInput.parentElement).not.toBeNull();

        fireEvent.paste(firstCodeInput.parentElement!, {
            clipboardData: { getData: () => '123456' },
        });

        await waitFor(() => {
            expect(verifySpy).toHaveBeenCalledWith('taras@tetrone.com', '123456');
        });

        // Крок 3: новий надійний пароль
        const newPassInput = await screen.findByLabelText('auth.new_password');
        const confirmPassInput = screen.getByLabelText('auth.confirm_new_password');

        fireEvent.change(newPassInput, { target: { value: 'Str0ng!Pass' } });
        fireEvent.change(confirmPassInput, { target: { value: 'Str0ng!Pass' } });

        fireEvent.click(screen.getByRole('button', { name: 'action.save_password' }));

        await waitFor(() => {
            expect(resetSpy).toHaveBeenCalledWith(
                'taras@tetrone.com',
                '123456',
                'Str0ng!Pass',
                'Str0ng!Pass'
            );
        });

        // Крок 4: повідомлення про успішну зміну
        expect(await screen.findByText('auth.password_reset_success')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'action.go_to_login' })).toBeInTheDocument();
    });

    it('clears digits and shows error when reset code is invalid', async () => {
        vi.spyOn(AuthService, 'forgotPassword').mockReturnValue(
            mockHandle({ code: 'RESET_CODE_SENT' })
        );
        vi.spyOn(AuthService, 'verifyResetCode').mockReturnValue(
            mockHandle({ code: 'ERR_INVALID_OR_EXPIRED_CODE' }, 400)
        );

        render(
            <MemoryRouter>
                <ForgotPasswordForm />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('auth.email'), {
            target: { value: 'taras@tetrone.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'action.get_code' }));

        const firstCodeInput = await screen.findByLabelText('auth.confirmation_code 1');
        const codeInputs = screen.getAllByRole('textbox');
        expect(firstCodeInput.parentElement).not.toBeNull();

        fireEvent.paste(firstCodeInput.parentElement!, {
            clipboardData: { getData: () => '999999' },
        });

        expect(
            await screen.findByText('code.ERR_INVALID_OR_EXPIRED_CODE')
        ).toBeInTheDocument();
        codeInputs.forEach((input) => {
            expect((input as HTMLInputElement).value).toBe('');
        });
    });
});

describe('BannedScreen', () => {
    const bannedUser: UserData = {
        username: 'banned_user',
        first_name: 'Тарас',
        last_name: null,
        avatar: null,
        gender: null,
        is_setup_complete: true,
        is_banned: true,
        is_deleted: false,
        is_verified: false,
        verification_badge: null,
        personalization: null,
        ban_reason: 'Порушення правил спільноти',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders ban reason, allows submitting an appeal, and supports logout', async () => {
        vi.spyOn(AppealService, 'checkStatus').mockReturnValue(
            mockHandle({ code: 'SUCCESS', has_pending_appeal: false })
        );
        const submitSpy = vi
            .spyOn(AppealService, 'submitAppeal')
            .mockReturnValue(mockHandle({ code: 'APPEAL_SUBMITTED' }, 201));
        const logoutMock = vi.fn();

        render(
            <AuthContext.Provider value={{ user: bannedUser, logout: logoutMock } as never}>
                <BannedScreen />
            </AuthContext.Provider>
        );

        expect(await screen.findByText('Порушення правил спільноти')).toBeInTheDocument();

        // Перевірка виходу з акаунта
        fireEvent.click(screen.getByRole('button', { name: 'action.logout' }));
        expect(logoutMock).toHaveBeenCalledTimes(1);

        // Відкриття форми апеляції та відправка
        fireEvent.click(screen.getByRole('button', { name: 'banned.appeal_btn' }));

        const textarea = screen.getByPlaceholderText('banned.appeal_placeholder');
        fireEvent.change(textarea, { target: { value: 'Прошу переглянути блокування.' } });

        fireEvent.click(screen.getByRole('button', { name: 'action.submit' }));

        await waitFor(() => {
            expect(submitSpy).toHaveBeenCalledWith('Прошу переглянути блокування.');
        });

        expect(await screen.findByText('banned.appeal_pending')).toBeInTheDocument();
    });

    it('shows pending notice immediately if appeal already exists', async () => {
        vi.spyOn(AppealService, 'checkStatus').mockReturnValue(
            mockHandle({ code: 'SUCCESS', has_pending_appeal: true })
        );

        render(
            <AuthContext.Provider value={{ user: bannedUser, logout: vi.fn() } as never}>
                <BannedScreen />
            </AuthContext.Provider>
        );

        expect(await screen.findByText('banned.appeal_pending')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'banned.appeal_btn' })).not.toBeInTheDocument();
    });
});