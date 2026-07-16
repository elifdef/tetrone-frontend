import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

const CookieBanner = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    // Зберігаємо індекс, щоб при зміні мови "на льоту" банер не стрибав на інший варіант
    const [randomIndex, setRandomIndex] = useState(null);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Отримуємо масив з перекладів
            const variants = t('cookie.variants', { returnObjects: true });

            // Генеруємо випадковий індекс від 0 до (довжина масиву - 1)
            const random = Math.floor(Math.random() * variants.length);

            setRandomIndex(random);
            setIsVisible(true);
        }
    }, [t]); // Додаємо t у залежності

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible || randomIndex === null) return null;

    const variants = t('cookie.variants', { returnObjects: true });
    const currentVariant = variants[randomIndex];

    return (
        <div className="tetrone-cookie-card">
            {currentVariant?.img && (
            <img
                src={currentVariant.img}
                alt="Cookie"
                className="tetrone-cookie-img"
                onError={(e) => e.target.style.display = 'none'}
            />
            )}
            <p className="tetrone-cookie-text">
                {currentVariant.message}
            </p>
            <div className="tetrone-cookie-actions">
                <Button onClick={handleAccept}>
                    {currentVariant.accept}
                </Button>
            </div>
        </div>
    );
};

export default CookieBanner;