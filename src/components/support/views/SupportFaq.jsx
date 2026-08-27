import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon } from '../../ui/Icons';
import Button from '../../ui/Button';

const FaqItem = React.memo(({ id, qKey, aKey, imgKey, isOpen, onToggle }) => {
    const { t } = useTranslation();

    return (
        <div className="border-b border-border last:border-b-0">
            <div
                className="flex justify-between items-center p-[10px] cursor-pointer hover:bg-[rgba(128,128,128,0.05)] font-bold text-theme-link select-none transition-colors"
                onClick={() => onToggle(id)}
            >
                <span>{t(qKey)}</span>
                <span className="text-text-muted">
                    {isOpen ? <ChevronUpIcon width={12} height={12} /> : <ChevronDownIcon width={12} height={12} />}
                </span>
            </div>
            {isOpen && (
                <div className="p-[10px] border-t border-border bg-[rgba(128,128,128,0.02)] leading-[1.4] text-text-main">
                    <div>{t(aKey)}</div>
                    {imgKey && (
                        <img
                            src={t(imgKey)}
                            alt="FAQ"
                            className="max-w-full mt-[10px] border border-border block"
                        />
                    )}
                </div>
            )}
        </div>
    );
});

export default function SupportFaq({ navigateTo, categoryId }) {
    const { t, i18n } = useTranslation();
    const [openFaqId, setOpenFaqId] = useState(null);

    const categoryFaqs = useMemo(() => {
        if (!categoryId) return [];
        const items = [];
        let index = 1;
        while (i18n.exists(`support.faq.${categoryId}.${index}_q`)) {
            const baseKey = `support.faq.${categoryId}.${index}`;
            items.push({
                id: index,
                q: `${baseKey}_q`,
                a: `${baseKey}_a`,
                img: i18n.exists(`${baseKey}_img`) ? `${baseKey}_img` : null
            });
            index++;
        }
        return items;
    }, [categoryId, i18n]);

    // 3. Функція перемикання ніколи не змінює своє посилання
    const toggleFaq = useCallback((id) => {
        setOpenFaqId(prevId => (prevId === id ? null : id));
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border max-md:-mt-[10px] max-md:-mx-[10px]">
                <span>{t(`support.cat_${categoryId}`)}</span>
                <div className="flex gap-[5px]">
                    <Button variant="primary" onClick={() => navigateTo('home')}>{t('action.go_back')}</Button>
                    <Button variant="secondary" onClick={() => navigateTo('form')}>{t('support.create_ticket')}</Button>
                </div>
            </div>

            <div>
                {categoryFaqs.length === 0 ? (
                    <div className="p-[20px] text-center text-text-muted italic border border-border bg-[rgba(128,128,128,0.02)]">
                        {t('support.no_questions_yet')}
                    </div>
                ) : (
                    <div className="border border-border bg-bg-page">
                        {/* 4. Передаємо тільки рядки, ідентифікатори та один колбек */}
                        {categoryFaqs.map(faq => (
                            <FaqItem
                                key={faq.id}
                                id={faq.id}
                                qKey={faq.q}
                                aKey={faq.a}
                                imgKey={faq.img}
                                isOpen={openFaqId === faq.id}
                                onToggle={toggleFaq}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}