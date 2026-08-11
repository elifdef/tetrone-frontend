import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import isoCountries from "i18n-iso-countries";

import uk from './locales/uk.json';

import isoUk from "i18n-iso-countries/langs/uk.json";

isoCountries.registerLocale(isoUk);

export const getSystemLanguage = () => {
    const saved = localStorage.getItem('lang');
    if (saved) 
        return saved;

    const rawLang = navigator.language || navigator.userLanguage;
    return rawLang.split('-')[0];
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            uk: { translation: uk }
        },
        lng: getSystemLanguage(),
        fallbackLng: "uk",
        load: 'languageOnly',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;