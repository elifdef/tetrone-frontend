import React from "react";
import { useTranslation } from "react-i18next";

export default function SiteNewsSection() {
    const { t } = useTranslation();

    // Імітуємо новини. Згодом заміниш на пропс або API-запит
    const news = [
        { date: t('main.news_date_1'), text: t('main.news_text_1') },
        { date: t('main.news_date_2'), text: t('main.news_text_2') },
        { date: t('main.news_date_3'), text: t('main.news_text_3') }
    ];

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-input-bg text-text-main font-bold py-[6px] px-[10px] text-[11px] border-b border-border">
                {t('main.landing_news_title')}
            </div>

            <div className="p-[15px] flex flex-col gap-[15px]">
                {news.map((item, index) => (
                    <div key={index} className="flex flex-col gap-[4px] text-[11px]">
                        <span className="text-text-muted font-bold">
                            {item.date}
                        </span>
                        <span className="text-text-main leading-[1.4]">
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}