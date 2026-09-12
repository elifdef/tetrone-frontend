import React from "react";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "../../config";
import FeatureBlock from "./FeatureBlock";
import randomRGB from "../../utils/randomRGB";

export default function WelcomeSection() {
    const { t } = useTranslation();
    const features = t('main.landing_features', { returnObjects: true }) || [];

    return (
        <>
            <div className="bg-bg-box border border-border p-[15px_20px]">
                <h1 className="text-[13px] font-bold text-theme-link m-0 mb-[10px] border-b border-border pb-[5px]">
                    {t('main.landing_title', { name: APP_NAME })}
                </h1>
                <p className="m-0 leading-[1.4] text-text-main">
                    {t('main.landing_subtitle')}
                </p>
            </div>

            <div className="flex flex-col gap-[10px]">
                {Array.isArray(features) && features.map((feature, index) => {
                    return (
                        <FeatureBlock
                            key={index}
                            title={feature.title}
                            description={feature.description}
                            image={feature.image}
                            imageAlt={feature.title}
                            color={randomRGB()}
                            isEven={index % 2 !== 0} // Кожен другий блок
                        />
                    );
                })}
            </div>
        </>
    );
}