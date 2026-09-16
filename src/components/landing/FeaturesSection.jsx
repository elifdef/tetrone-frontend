import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FeatureBlock from "./FeatureBlock";
import randomRGB from "../../utils/randomRGB";

export default function FeaturesSection({ isMobile }) {
    const { t } = useTranslation();
    const features = t('main.landing_features', { returnObjects: true }) || [];
    const colors = useMemo(() => features.map(() => randomRGB()), [features.length]);

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isMobile || features.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isMobile, features.length]);

    if (isMobile && features.length > 0) {
        const currentFeature = features[currentIndex];
        const currentColor = colors[currentIndex];

        return (
            <div className="w-full bg-bg-box border border-border flex flex-col flex-1 min-h-0">
                <div 
                    key={currentIndex} 
                    className="flex-1 flex flex-col min-h-0 items-center text-center animate-[fadeIn_0.3s_ease-in-out]"
                >
                    <div 
                        className="w-full flex-1 min-h-0 flex items-center justify-center bg-input-bg border-b-[1px]"
                        style={{ borderColor: currentColor }}
                    >
                        <img 
                            src={currentFeature.image} 
                            alt={currentFeature.title} 
                            className="w-full h-full object-fill block"
                        />
                    </div>
                    
                    <div className="shrink-0 w-full p-[12px_15px_10px]">
                        <h3 className="text-[14px] font-bold m-0 mb-[6px]" style={{ color: currentColor }}>
                            {currentFeature.title}
                        </h3>
                        <p className="text-[11px] text-text-main m-0 leading-[1.3]">
                            {currentFeature.description}
                        </p>
                    </div>
                </div>

                <div className="flex justify-center gap-[8px] pb-[12px] shrink-0">
                    {features.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-[10px] h-[10px] p-0 border-none cursor-pointer ${
                                idx === currentIndex ? 'bg-theme-link scale-110' : 'bg-border hover:bg-text-muted'
                            }`}
                            aria-label={`Slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[10px]">
            {features.map((feature, index) => (
                <FeatureBlock
                    key={index}
                    title={feature.title}
                    description={feature.description}
                    image={feature.image}
                    imageAlt={feature.title}
                    color={colors[index]}
                    isEven={index % 2 !== 0}
                />
            ))}
        </div>
    );
}