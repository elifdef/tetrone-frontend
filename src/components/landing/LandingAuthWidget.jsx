import { useState } from "react";
import { useTranslation } from "react-i18next";
import LoginForm from "../auth/LoginForm";
import RegisterForm from "../auth/RegisterForm";

export default function LandingAuthWidget() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("register");

    const getTabClass = (tabName) => {
        const base = "flex-1 py-[10px] border-none bg-transparent font-bold text-[12px] cursor-pointer transition-all outline-none ";
        return activeTab === tabName
            ? base + "bg-bg-box text-theme-link shadow-[inset_0_-2px_0_var(--theme-link)]"
            : base + "text-text-muted hover:text-text-main";
    };

    return (
        <div className="bg-bg-box border border-border">
            <div className="p-[15px] text-center text-[13px] font-medium text-text-main bg-bg-box border-b border-border">
                <h1 className="text-[15px] m-0 mb-[5px] font-bold">
                    {t('main.landing_join_header')}
                </h1>
                <span className="text-[11px] text-text-muted">
                    {t('main.landing_join_desc')}
                </span>
            </div>

            <div className="flex bg-header-bg border-b border-border">
                <button
                    className={getTabClass('register')}
                    onClick={() => setActiveTab('register')}
                >
                    {t('auth.title_register')}
                </button>
                <button
                    className={getTabClass('login')}
                    onClick={() => setActiveTab('login')}
                >
                    {t('auth.title_login')}
                </button>
            </div>

            <div className="p-[15px]">
                {activeTab === 'login' && <LoginForm />}
                {activeTab === 'register' && <RegisterForm />}
            </div>
        </div>
    );
}