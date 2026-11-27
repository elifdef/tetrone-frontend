import { useTranslation } from 'react-i18next';
import Footer from '@/components/layout/Footer';
import LoginForm from '@features/auth/components/LoginForm';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function LoginPage() {
    const { t } = useTranslation();
    usePageTitle(t('action.login'));

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-main font-tahoma text-[11px]">
            <div className="flex-1 flex items-center justify-center p-[20px]">
                <div className="w-full max-w-[440px] bg-bg-box border border-border shadow-[0_2px_10px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link py-[10px] px-[18px]">
                        <h1 className="text-[13px] font-bold text-theme-link m-0">
                            {t('action.login')}
                        </h1>
                    </div>
                    <LoginForm />
                </div>
            </div>
            <Footer />
        </div>
    );
}