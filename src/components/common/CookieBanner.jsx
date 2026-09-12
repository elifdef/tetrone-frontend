import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

const CookieBanner = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [randomIndex, setRandomIndex] = useState(null);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            const variants = t('cookie.variants', { returnObjects: true });
            const random = Math.floor(Math.random() * variants.length);
            setRandomIndex(random);
            setIsVisible(true);
        }
    }, [t]);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible || randomIndex === null) return null;

    const variants = t('cookie.variants', { returnObjects: true });
    const currentVariant = variants[randomIndex];

    return (
        <div className="fixed bottom-[15px] right-[15px] w-[260px] bg-bg-box border border-border shadow-[0_2px_10px_rgba(0,0,0,0.15)] p-[12px] rounded-[2px] z-[9999] flex flex-col items-center text-center font-tahoma text-[11px] text-text-main">
            {currentVariant?.img && (
                <img
                    src={currentVariant.img}
                    alt="Cookie"
                    className="w-[40px] h-[40px] object-contain mb-[8px]"
                    onError={(e) => e.target.style.display = 'none'}
                />
            )}
            <p className="m-0 mb-[12px] leading-[1.4] text-text-main">
                {currentVariant.message}
            </p>
            <div className="w-full flex justify-center">
                <Button onClick={handleAccept} className="w-full">
                    {currentVariant.accept}
                </Button>
            </div>
        </div>
    );
};

export default CookieBanner;