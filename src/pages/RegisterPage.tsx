import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Footer from '@/components/layout/Footer';
import RegisterForm from '@features/auth/components/RegisterForm';
import { usePageTitle } from '@/hooks/usePageTitle';

const REGISTER_PERKS = [
    'auth.register_perk_1',
    'auth.register_perk_2',
    'auth.register_perk_3',
    'auth.register_perk_4',
    'auth.register_perk_5',
    'auth.register_perk_6',
] as const;

export default function RegisterPage() {
    const { t } = useTranslation();
    usePageTitle(t('action.register'));

    return (
        <div className="flex flex-col min-h-screen bg-bg-page text-text-main font-tahoma text-[11px]">
            <div className="flex-1 flex items-center justify-center p-[15px]">
                <div className="w-full max-w-[780px] bg-bg-box border border-border shadow-[0_2px_8px_rgba(0,0,0,0.06)] grid grid-cols-1 md:grid-cols-[260px_1fr]">
                    <div className="bg-bg-page border-b md:border-b-0 md:border-r border-border p-[18px] flex flex-col justify-between gap-[16px]">
                        <div className="flex flex-col gap-[10px]">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-[8px] no-underline text-theme-link font-bold text-[15px] tracking-[0.5px]"
                            >
                                <span className="w-[22px] h-[22px] bg-theme-link text-white flex items-center justify-center text-[12px] font-bold">
                                    T
                                </span>
                                <span>TETRONE</span>
                            </Link>

                            <h2 className="m-0 text-[12px] font-bold text-text-main">
                                {t('main.landing_join_header')}
                            </h2>

                            <p className="m-0 text-[11px] text-text-muted leading-[1.45]">
                                {t('auth.register_features_desc')}
                            </p>

                            <div className="mt-[6px] pt-[10px] border-t border-dashed border-border flex flex-col gap-[8px] text-[10px] text-text-muted">
                                {REGISTER_PERKS.map((key) => (
                                    <div key={key} className="flex items-start gap-[6px]">
                                        <span className="text-theme-success font-bold">✓</span>
                                        <span>{t(key)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-[10px] text-text-muted border-t border-border pt-[10px]">
                            {t('auth.security_notice_footer')}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link py-[8px] px-[15px]">
                            <h1 className="text-[12px] font-bold text-theme-link m-0">
                                {t('action.register')}
                            </h1>
                        </div>
                        <RegisterForm />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}