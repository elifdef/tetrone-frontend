import React from "react";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "../../config";
import FeatureBlock from "./FeatureBlock";
import randomRGB from "../../utils/randomRGB";

export default function WelcomeSection()
{
    const { t } = useTranslation();
    const features = t('main.landing_features', { returnObjects: true }) || [];

    return (<>
        <div className="tetrone-landing-welcome-box">
            <h1 className="tetrone-landing-welcome-title">
                { t('main.landing_title', { name: APP_NAME }) }
            </h1>
            <p className="tetrone-landing-welcome-text">
                { t('main.landing_subtitle') }
            </p>
        </div>

        <div className="tetrone-landing-features-list">
            { Array.isArray(features) && features.map((feature, index) =>
            {
                return (<FeatureBlock
                    key={ index }
                    title={ feature.title }
                    description={ feature.description }
                    image={ feature.image }
                    imageAlt={ feature.title }
                    color={ randomRGB() }
                />);
            }) }
        </div>
    </>);
}