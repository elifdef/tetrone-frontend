import React from "react";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "../../config";

export default function WelcomeHeader({ isMobile }) {
    const { t } = useTranslation();
    return (
        <div className="bg-bg-box border border-border p-[10px_15px] md:p-[15px_20px] text-center md:text-left shrink-0">
            <h1 className="text-[14px] md:text-[13px] font-bold text-theme-link m-0 mb-[5px] md:mb-[10px] border-b border-border pb-[5px]">
                {t('main.landing_title', { name: APP_NAME })}
            </h1>
            <p className="m-0 leading-[1.4] text-text-main text-[11px]">
                {t('main.landing_subtitle')}
            </p>
        </div>
    );
}