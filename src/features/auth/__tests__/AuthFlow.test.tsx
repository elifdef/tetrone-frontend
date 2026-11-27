import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import LoginForm from '../components/LoginForm';
import AuthService from '@/services/auth.service';
import { AuthContext } from '@/context/AuthContext';
import type { ApiRequestHandle, ApiResponse } from '@/types/api';

vi.mock('react-i18next', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-i18next')>();
    return {
        ...actual,
        useTranslation: () => ({ t: (k: string) => k }),
    };
});

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

describe('Unified Login Form & Pattern Modal Auth Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders identical password form for all users and opens pattern modal via other sign-in method button', async () => {
        const signInSpy = vi.spyOn(AuthService, 'signIn').mockReturnValue(
            mockHandle({
                code: 'LOGIN_SUCCESS',
                user: { username: 'taras_dev' } as never,
            })
        );

        render(
            <AuthContext.Provider value={{ login: vi.fn() } as never}>
                <MemoryRouter>
                    <LoginForm />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        expect(screen.getByLabelText('auth.email_or_username')).toBeInTheDocument();
        expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
        expect(screen.queryByText('auth.tile_pattern_title')).not.toBeInTheDocument();

        // Натискання "Інший спосіб входу" розкриває вибір графічного ключа
        fireEvent.click(screen.getByRole('button', { name: 'auth.other_sign_in_method' }));
        const patternTile = await screen.findByText('auth.tile_pattern_title');

        // Якщо логін не введено — показується помилка обов'язковості поля
        fireEvent.click(patternTile);
        expect(await screen.findByText('validation.required')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        // Після введення логіна відкривається сітка 4x4
        fireEvent.change(screen.getByLabelText('auth.email_or_username'), {
            target: { value: 'taras_dev' },
        });
        fireEvent.click(patternTile);

        expect(await screen.findByRole('dialog')).toBeInTheDocument();

        const cells = screen.getAllByRole('button', { name: /auth\.pattern_cell_aria/i });
        expect(cells).toHaveLength(16);

        [0, 5, 10, 15, 11].forEach((idx) => fireEvent.click(cells[idx]));
        const submitButtons = screen.getAllByRole('button', { name: 'action.login' });
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => {
            expect(signInSpy).toHaveBeenCalledWith({
                login: 'taras_dev',
                method: 'pattern',
                pattern: [0, 5, 10, 15, 11],
            });
        });
    });

    it('shows unified credentials error on untrusted device and locks modal on 423', async () => {
        const signInSpy = vi
            .spyOn(AuthService, 'signIn')
            .mockReturnValueOnce(mockHandle({ code: 'ERR_INVALID_CREDENTIALS' } as never, 401))
            .mockReturnValueOnce(mockHandle({ code: 'ERR_PATTERN_LOCKED' } as never, 423));

        render(
            <AuthContext.Provider value={{ login: vi.fn() } as never}>
                <MemoryRouter>
                    <LoginForm />
                </MemoryRouter>
            </AuthContext.Provider>
        );

        fireEvent.change(screen.getByLabelText('auth.email_or_username'), {
            target: { value: 'taras_dev' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'auth.other_sign_in_method' }));
        fireEvent.click(await screen.findByText('auth.tile_pattern_title'));

        const cells = await screen.findAllByRole('button', { name: /auth\.pattern_cell_aria/i });
        [0, 1, 2, 3, 4].forEach((idx) => fireEvent.click(cells[idx]));

        const submitButtons = screen.getAllByRole('button', { name: 'action.login' });
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        expect(await screen.findByText('code.ERR_INVALID_CREDENTIALS')).toBeInTheDocument();

        // Повторна спроба з 423 блокує сітку в модалці
        const refreshedCells = screen.getAllByRole('button', { name: /auth\.pattern_cell_aria/i });
        [0, 1, 2, 3, 4].forEach((idx) => fireEvent.click(refreshedCells[idx]));

        const submitButtonsAgain = screen.getAllByRole('button', { name: 'action.login' });
        fireEvent.click(submitButtonsAgain[submitButtonsAgain.length - 1]);

        expect(await screen.findByText('auth.pattern_locked_fallback_hint')).toBeInTheDocument();
        expect(refreshedCells[0]).toBeDisabled();
        expect(signInSpy).toHaveBeenCalledTimes(2);
    });
});