import Footer from "../components/layout/Footer";
import RegisterForm from "../components/auth/RegisterForm";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
    const { t } = useTranslation();
    usePageTitle(t('action.register'));

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-main font-tahoma text-[11px]">
            <div className="flex-1 flex items-center justify-center p-[15px]">
                <div className="w-full max-w-[400px] bg-bg-box border border-border shadow-[0_1px_4px_rgba(0,0,0,0.05)] rounded-[2px] overflow-hidden">
                    <div className="bg-header-bg border-b border-border py-[8px] px-[15px]">
                        <h1 className="text-[13px] font-bold text-section-text m-0">{t('action.register')}</h1>
                    </div>
                    <RegisterForm />
                </div>
            </div>
            <Footer />
        </div>
    );
}