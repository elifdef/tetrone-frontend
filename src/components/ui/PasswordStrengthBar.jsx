import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return score;

    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return score;
};

// Використовуємо класичний синій колір кнопок для індикатора
const getStrengthColor = (score) => score ? 'var(--theme-btn-primary-bg)' : 'transparent';

const PasswordStrengthBar = ({ password, onScoreChange }) => {
    const { t } = useTranslation();
    const score = useMemo(() => calculatePasswordStrength(password), [password]);

    useEffect(() => {
        if (onScoreChange) {
            onScoreChange(score);
        }
    }, [score, onScoreChange]);

    if (!password) return null;

    return (
        <div className="flex flex-col gap-[4px] mt-[4px]">
            <div className="w-full h-[4px] bg-input-bg border border-input-border rounded-[2px] overflow-hidden">
                <div
                    className="h-full transition-all duration-300 ease-out"
                    style={{
                        width: `${(score / 5) * 100}%`,
                        backgroundColor: getStrengthColor(score)
                    }}
                ></div>
            </div>
            <div className="text-[9px] text-text-muted text-center leading-[1.2]">
                {t('auth.password_requirements')}
            </div>
        </div>
    );
};

export default PasswordStrengthBar;