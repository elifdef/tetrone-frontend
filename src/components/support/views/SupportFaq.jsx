import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon } from '../../ui/Icons';
import Button from '../../ui/Button';

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

    const toggleFaq = (id) => {
        setOpenFaqId(openFaqId === id ? null : id);
    };

    return (
        <div className="tetrone-support-block">
            <div className="tetrone-support-block-header tetrone-flex-between">
                <span>{t(`support.cat_${categoryId}`)}</span>
                <div className="tetrone-support-actions-mini">
                    <Button variant="primary" onClick={() => navigateTo('home')}>{t('action.go_back')}</Button>
                    <Button variant="secondary" onClick={() => navigateTo('form')}>{t('support.create_ticket')}</Button>
                </div>
            </div>

            <div className="tetrone-support-block-content">
                {categoryFaqs.length === 0 ? (
                    <div className="tetrone-support-empty">{t('support.no_questions_yet')}</div>
                ) : (
                    <div className="tetrone-support-faq-list">
                        {categoryFaqs.map(faq => {
                            const isOpen = openFaqId === faq.id;
                            return (
                                <div key={faq.id} className="tetrone-support-faq-item">
                                    <div className="tetrone-support-faq-header" onClick={() => toggleFaq(faq.id)}>
                                        <span>{t(faq.q)}</span>
                                        <span>{isOpen ? <ChevronUpIcon width={12} height={12} /> : <ChevronDownIcon width={12} height={12} />}</span>
                                    </div>
                                    {isOpen && (
                                        <div className="tetrone-support-faq-body">
                                            <div>{t(faq.a)}</div>
                                            {faq.img && <img src={t(faq.img)} alt="FAQ" className="tetrone-support-faq-image" />}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}