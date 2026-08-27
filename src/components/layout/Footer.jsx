import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { APP_NAME } from "../../config";
import "flag-icons/css/flag-icons.min.css";
import { memo } from "react";
import { useTheme } from "../../context/ThemeContext";

const SUPPORTED_LANGUAGES = [
    { code: 'uk', countryCode: 'ua', name: 'Українська' },
    { code: 'en', countryCode: 'gb', name: 'English' },
];

const Footer = () => {
    const { t, i18n } = useTranslation();
    const { theme, toggleDark } = useTheme(); // Беремо стейт і функцію з Контексту

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
    };

    const isActive = (lang) => i18n.language.startsWith(lang);

    return (
        <footer className="py-[30px] px-[15px] text-center border-t border-border mt-[40px]">
            <div className="flex justify-center items-center flex-wrap gap-[15px] mb-[15px] last:mb-0">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <span
                        key={lang.code}
                        className={`cursor-pointer text-[16px] opacity-40 transition-opacity flex items-center hover:opacity-80 ${isActive(lang.code) ? 'opacity-100 cursor-default' : ''}`}
                        onClick={() => changeLanguage(lang.code)}
                        title={lang.name}
                    >
                        <span className={`fi fi-${lang.countryCode}`}></span>
                    </span>
                ))}

                <span className="text-text-muted mx-[4px] opacity-50">|</span>

                <span
                    className="cursor-pointer text-[16px] opacity-40 transition-opacity flex items-center justify-center hover:opacity-80"
                    onClick={toggleDark} // Миттєво перемикає тему!
                    title={t('action.toggle_theme')}
                >
                    {theme.isDark ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    )}
                </span>
            </div>

            <div className="flex justify-center items-center flex-wrap gap-[15px] mb-[15px] last:mb-0">
                <Link to="/rules" className="text-[12px] text-theme-link no-underline transition-colors hover:underline">
                    {t('common.rules')}
                </Link>
                <Link to="/support" className="text-[12px] text-theme-link no-underline transition-colors hover:underline">
                    {t('common.support')}
                </Link>
                <Link to="/about" className="text-[12px] text-theme-link no-underline transition-colors hover:underline">
                    {t('common.about')}
                </Link>
            </div>

            <div className="flex justify-center items-center flex-wrap gap-[15px] mb-[15px] last:mb-0">
                <span className="text-[11px] text-text-muted">
                    {APP_NAME} © 2025 - 2026. {t('footer.text')}
                </span>
            </div>
        </footer>
    );
}

export default memo(Footer);