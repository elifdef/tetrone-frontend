import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';

export interface ThemeState {
    siteTheme: string;
    isDark: boolean;
    profileTheme: string;
    [key: string]: unknown;
}

export interface ThemeContextValue {
    theme: ThemeState;
    setThemeState: Dispatch<SetStateAction<ThemeState>>;
    toggleDark: () => void;
    changeSiteTheme: (siteTheme: string) => void;
    changeProfileTheme: (profileTheme: string) => void;
}

export const DEFAULT_PERSONALIZATION: ThemeState = {
    siteTheme: 'classic',
    isDark: true,
    profileTheme: 'classic',
};

export const ThemeContext = createContext<ThemeContextValue>({
    theme: DEFAULT_PERSONALIZATION,
    setThemeState: () => {},
    toggleDark: () => {},
    changeSiteTheme: () => {},
    changeProfileTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
