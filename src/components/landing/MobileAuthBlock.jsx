import { useState } from "react";
import { useTranslation } from "react-i18next";
import LoginForm from "../auth/LoginForm";
import RegisterForm from "../auth/RegisterForm";

export default function MobileAuthBlock() {
    const { t } = useTranslation();
    const [activeForm, setActiveForm] = useState(null);

    return (
        <div className="bg-bg-box border border-border p-[12px_15px] text-center shrink-0 flex flex-col">
            <h2 className="text-[14px] font-bold text-text-main m-0 mb-[10px] uppercase">
                {t('main.landing_join_header')}
            </h2>
            <p className="text-[11px] text-text-muted m-0 mb-[20px] leading-[1.4]">
                {t('main.landing_join_desc')}
            </p>

            <div className="flex gap-[10px] shrink-0">
                <button
                    onClick={() => setActiveForm(activeForm === 'register' ? null : 'register')}
                    className={`flex-1 py-[10px] px-[15px] font-bold text-[13px] border cursor-pointer transition-colors ${activeForm === 'register' ? 'bg-theme-success text-white border-theme-success' : 'bg-theme-success/10 text-theme-success border-theme-success/30 hover:bg-theme-success hover:text-white'}`}
                >
                    {t('auth.title_register')}
                </button>
                <button
                    onClick={() => setActiveForm(activeForm === 'login' ? null : 'login')}
                    className={`flex-1 py-[10px] px-[15px] font-bold text-[13px] border cursor-pointer transition-colors ${activeForm === 'login' ? 'bg-theme-link text-white border-theme-link' : 'bg-theme-link/10 text-theme-link border-theme-link/30 hover:bg-theme-link hover:text-white'}`}
                >
                    {t('auth.title_login')}
                </button>
            </div>

            {activeForm && (
                <div className="mt-[15px] text-left border-t border-border pt-[12px] flex-1">
                    {activeForm === 'register' && <RegisterForm />}
                    {activeForm === 'login' && <LoginForm />}
                </div>
            )}
        </div>
    );
}