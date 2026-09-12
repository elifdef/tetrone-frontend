import { useTranslation } from 'react-i18next';
import { usePageTitle } from "../hooks/usePageTitle";
import ProfileSettings from "../components/settings/ProfileSettings";

export default function SetupProfilePage() {
    const { t } = useTranslation();
    usePageTitle(t('first_setup.title'));

    return (
        <div className="w-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-[20px] max-md:p-[10px] font-tahoma text-[11px] text-text-main">
            <div className="w-full max-w-[700px] flex flex-col gap-[15px]">

                {/* Блок заголовка */}
                <div className="bg-bg-box border border-border p-[15px] text-center shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] rounded-[3px]">
                    <h1 className="text-[14px] font-bold text-theme-link m-0 mb-[5px] uppercase tracking-[0.5px]">
                        {t('first_setup.title')}
                    </h1>
                    <p className="text-[11px] text-text-muted m-0">
                        {t('first_setup.fill_details')}
                    </p>
                </div>

                {/* Сам компонент налаштувань */}
                <ProfileSettings isSetupMode={true} />

            </div>
        </div>
    );
}