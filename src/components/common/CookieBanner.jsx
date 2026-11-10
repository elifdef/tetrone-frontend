import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

const CookieBanner = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [randomIndex, setRandomIndex] = useState(null);

    useEffect(() => {
        const consent = localStorage.getItem('tetrone_cookie_consent');
        if (!consent) {
            const variants = t('cookie.variants', { returnObjects: true });
            if (Array.isArray(variants) && variants.length > 0) {
                const random = Math.floor(Math.random() * variants.length);
                setRandomIndex(random);
                setIsVisible(true);
            }
        }
    }, [t]);

    const handleAccept = () => {
        localStorage.setItem('tetrone_cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('tetrone_cookie_consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible || randomIndex === null) return null;

    const variants = t('cookie.variants', { returnObjects: true });
    const currentVariant = Array.isArray(variants) ? variants[randomIndex] : null;

    if (!currentVariant) return null;

    const declineText = currentVariant.decline || t('action.dismiss');

    return (
        <div className="fixed bottom-[15px] left-1/2 -translate-x-1/2 w-[calc(100%-30px)] max-w-[560px] bg-bg-box border border-border shadow-[0_4px_12px_rgba(0,0,0,0.25)] p-[10px] z-[9999] font-tahoma text-[11px] text-text-main flex items-center gap-[12px] rounded-none max-md:flex-col max-md:items-stretch">
            {currentVariant?.img && (
                <div className="w-[44px] h-[44px] shrink-0 bg-bg-page border border-border p-[2px] flex items-center justify-center max-md:self-center">
                    <img
                        src={currentVariant.img}
                        alt="Cookie"
                        className="w-full h-full object-contain block"
                        onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                    />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <p className="m-0 leading-[1.4] text-text-main break-words">
                    {currentVariant.message}
                </p>
            </div>

            <Button onClick={handleAccept} variant='primary'>
                {currentVariant.accept}
            </Button>
            <Button onClick={handleDecline} variant='secondary'>
                {declineText}
            </Button>
        </div>
    );
};

export default CookieBanner;