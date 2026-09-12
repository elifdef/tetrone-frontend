import { useTranslation } from 'react-i18next';
import Button from './Button';

export default function ErrorState({ title, description, onRetry, buttonText, showButton = true }) {
    const { t } = useTranslation();

    const handleRetry = onRetry || (() => window.location.reload());

    return (
        <div className="w-full bg-bg-box border border-border p-[30px_20px] flex flex-col items-center justify-center text-center font-tahoma rounded-[2px]">
            {title && (
                <div className="text-[13px] font-bold text-text-main mb-[8px]">
                    {title}
                </div>
            )}

            {description && (
                <div className="text-[11px] text-text-muted leading-[1.4] max-w-[80%]">
                    {description}
                </div>
            )}

            {showButton && (
                <div className="mt-[15px]">
                    <Button onClick={handleRetry}>
                        {buttonText || t('action.refresh')}
                    </Button>
                </div>
            )}
        </div>
    );
}