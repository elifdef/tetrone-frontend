import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { DEFAULT_PERSONALIZATION, ThemeContext, type ThemeState } from './theme-context';

const STORAGE_KEY = 'tetrone_personalization';

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [theme, setThemeState] = useState<ThemeState>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as Partial<ThemeState>;
                return { ...DEFAULT_PERSONALIZATION, ...parsed };
            }
        } catch {
            // ignore corrupted storage
        }

        return DEFAULT_PERSONALIZATION;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));

        if (theme.isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        if (theme.siteTheme && theme.siteTheme !== 'classic') {
            document.documentElement.setAttribute('data-style', theme.siteTheme);
        } else {
            document.documentElement.removeAttribute('data-style');
        }
    }, [theme]);

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue) as Partial<ThemeState>;
                    setThemeState({ ...DEFAULT_PERSONALIZATION, ...parsed });
                } catch {
                    // ignore corrupted storage
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const toggleDark = useCallback(() => {
        setThemeState((prev) => ({ ...prev, isDark: !prev.isDark }));
    }, []);

    const changeSiteTheme = useCallback((siteTheme: string) => {
        setThemeState((prev) => ({ ...prev, siteTheme }));
    }, []);

    const changeProfileTheme = useCallback((profileTheme: string) => {
        setThemeState((prev) => ({ ...prev, profileTheme }));
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setThemeState,
                toggleDark,
                changeSiteTheme,
                changeProfileTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};
