import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import isoCountries from 'i18n-iso-countries';
import isoUk from 'i18n-iso-countries/langs/uk.json';
import uk from './locales/uk.json';

isoCountries.registerLocale(isoUk);

export const getSystemLanguage = (): string => {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;

    const nav = navigator as Navigator & { userLanguage?: string };
    const rawLang = nav.language || nav.userLanguage || 'uk';
    return rawLang.split('-')[0] || 'uk';
};

i18n.use(initReactI18next).init({
    resources: {
        uk: { translation: uk },
    },
    lng: getSystemLanguage(),
    fallbackLng: 'uk',
    load: 'languageOnly',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;