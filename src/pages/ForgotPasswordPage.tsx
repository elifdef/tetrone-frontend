import { useTranslation } from 'react-i18next';
import Footer from '@/components/layout/Footer';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    usePageTitle(t('auth.forgot_password_title'));

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-main font-tahoma text-[11px]">
            <div className="flex-1 flex items-center justify-center p-[15px]">
                <div className="w-full max-w-[380px] bg-bg-box border border-border shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
                    <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link py-[8px] px-[15px]">
                        <h1 className="text-[12px] font-bold text-theme-link m-0">
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