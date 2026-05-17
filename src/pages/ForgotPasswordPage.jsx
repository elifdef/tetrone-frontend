import Footer from "../components/layout/Footer";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    usePageTitle(t('auth.forgot_password_title'));

    return (
        <div className="tetrone-fullscreen-center">
            <div className="tetrone-auth-card">
                <div className="tetrone-auth-header">
                    <h1 className="tetrone-auth-title">{t('auth.forgot_password_title')}</h1>
                </div>
                <ForgotPasswordForm />
            </div>
            <Footer />
        </div>
    );
}