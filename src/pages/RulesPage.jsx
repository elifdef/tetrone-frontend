import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';

export default function RulesPage() {
    const { t } = useTranslation();
    usePageTitle(t('rules.page_title'));

    // Отримуємо масив правил з локалізації
    const rulesList = t('rules.items', { returnObjects: true }) || [];

    return (
        <div className="w-full max-w-[800px] mx-auto box-border p-[20px] bg-bg-page border border-border font-tahoma text-[11px] text-text-main max-md:p-[10px]">

            <h1 className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border max-md:-mt-[10px] max-md:-mx-[10px]">
                {t('rules.header')}
            </h1>

            <div className="mb-[20px]">
                {Array.isArray(rulesList) && rulesList.map((rule, index) => (
                    <div key={index} className="mb-[20px] last:mb-0">
                        <h3 className="m-0 mb-[8px] text-[12px] font-bold text-theme-link border-b border-border pb-[4px]">
                            {index + 1}. {rule.title}
                        </h3>

                        {rule.text && (
                            <p
                                className="m-0 mb-[8px] leading-[1.4]"
                                dangerouslySetInnerHTML={{ __html: rule.text }}
                            />
                        )}

                        {Array.isArray(rule.subItems) && rule.subItems.length > 0 && (
                            <ol className="m-0 p-0 pl-[25px] list-decimal text-[11px] leading-[1.5] text-text-main">
                                {rule.subItems.map((subItem, subIndex) => (
                                    <li
                                        key={subIndex}
                                        className="mb-[4px] pl-[5px] last:mb-0"
                                        dangerouslySetInnerHTML={{ __html: subItem }}
                                    />
                                ))}
                            </ol>
                        )}
                    </div>
                ))}
            </div>

            {/* Футер-нотатка винесена в акуратний блок, як ми робили з InfoBox */}
            <div className="bg-[rgba(128,128,128,0.05)] border border-border p-[10px] mt-[10px]">
                <p className="m-0 text-center text-text-muted italic text-[11px]">
                    {t('easter_eggs.footer_note')}
                </p>
            </div>

        </div>
    );
}