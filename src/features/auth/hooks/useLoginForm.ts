import { useState, useContext, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router';
import AuthService from '@/services/auth.service';
import { AuthContext } from '@/context/AuthContext';
import { MIN_PATTERN_LENGTH } from '../components/PatternGrid';

export function useLoginForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useContext(AuthContext);

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [pattern, setPattern] = useState<number[]>([]);

    const [isOtherMethodsOpen, setIsOtherMethodsOpen] = useState(false);
    const [patternLocked, setPatternLocked] = useState(false);
    const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleIdentifierChange = (value: string) => {
        setIdentifier(value);
        if (error) setError(null);
        if (patternLocked) setPatternLocked(false);
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (error) setError(null);
    };

    const handlePatternChange = (nextPattern: number[]) => {
        setPattern(nextPattern);
        if (error) setError(null);
    };

    const handleToggleOtherMethods = () => {
        setError(null);
        setIsOtherMethodsOpen((prev) => !prev);
    };

    const handleOpenPatternModal = () => {
        const trimmed = identifier.trim();
        if (!trimmed) {
            setError(t('validation.required'));
            return;
        }

        setError(null);
        setPattern([]);
        setIsPatternModalOpen(true);
    };

    const handleClosePatternModal = () => {
        if (isSubmitting) return;
        setIsPatternModalOpen(false);
        setPattern([]);
        setError(null);
    };

    const handleAuthenticatePassword = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        const trimmedLogin = identifier.trim();
        if (!trimmedLogin || isSubmitting) return;

        if (!password) {
            setError(t('validation.required'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const res = await AuthService.signIn({
            login: trimmedLogin,
            method: 'password',
            password,
        });

        setIsSubmitting(false);

        if (res.status === 200 && res.user) {
            login(res.user);
            const state = location.state as { from?: { pathname?: string } } | null;
            const from = state?.from?.pathname || '/';
            navigate(from, { replace: true });
            return;
        }

        const errorCode = res.code || 'ERR_UNKNOWN';
        setError(t(`code.${errorCode}`));
    };

    const handleAuthenticatePattern = async (patternToSubmit: number[]) => {
        const trimmedLogin = identifier.trim();
        if (!trimmedLogin || isSubmitting) return;

        if (patternToSubmit.length < MIN_PATTERN_LENGTH) {
            setError(t('auth.pattern_min_error'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const res = await AuthService.signIn({
            login: trimmedLogin,
            method: 'pattern',
            pattern: patternToSubmit,
        });

        setIsSubmitting(false);

        if (res.status === 200 && res.user) {
            setIsPatternModalOpen(false);
            login(res.user);
            const state = location.state as { from?: { pathname?: string } } | null;
            const from = state?.from?.pathname || '/';
            navigate(from, { replace: true });
            return;
        }

        const errorCode = res.code || 'ERR_UNKNOWN';

        if (errorCode === 'ERR_PATTERN_LOCKED') {
            setPatternLocked(true);
            setPattern([]);
            setError(t('code.ERR_PATTERN_LOCKED'));
            return;
        }

        setPattern([]);
        setError(t(`code.${errorCode}`));
    };

    return {
        identifier,
        password,
        pattern,
        isOtherMethodsOpen,
        patternLocked,
        isPatternModalOpen,
        isSubmitting,
        error,
        handleIdentifierChange,
        handlePasswordChange,
        handlePatternChange,
        handleToggleOtherMethods,
        handleOpenPatternModal,
        handleClosePatternModal,
        handleAuthenticatePassword,
        handleAuthenticatePattern,
    };
}