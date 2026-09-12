import Footer from "../components/layout/Footer";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    usePageTitle(t('auth.forgot_password_title'));

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-main font-tahoma text-[11px]">
            <div className="flex-1 flex items-center justify-center p-[15px]">
                <div className="w-full max-w-[360px] bg-bg-box border border-border shadow-[0_1px_4px_rgba(0,0,0,0.05)] rounded-[2px] overflow-hidden">
                    <div className="bg-header-bg border-b border-border py-[8px] px-[15px]">
                        <h1 className="text-[13px] font-bold text-section-text m-0">
                            {t('auth.forgot_password_title')}
                        </h1>
                    </div>
                    <ForgotPasswordForm />
                </div>
            </div>
            <Footer />
        </div>
    );
}