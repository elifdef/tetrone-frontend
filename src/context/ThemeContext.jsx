import {createContext, useState, useEffect, useContext} from 'react';

export const ThemeContext = createContext();

const STORAGE_KEY = 'tetrone_personalization';

const DEFAULT_PERSONALIZATION = {
    siteTheme: "classic",
    isDark: true,
    profileTheme: 'classic',
};

export const ThemeProvider = ({children}) =>
{
    const [theme, setThemeState] = useState(() =>
    {
        try
        {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved)
            {
                return {...DEFAULT_PERSONALIZATION, ...JSON.parse(saved)};
            }
        } catch (e)
        {
        }

        return DEFAULT_PERSONALIZATION;
    });

    useEffect(() =>
    {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));

        if (theme.isDark)
        {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else
        {
            document.documentElement.removeAttribute('data-theme');
        }

        if (theme.siteTheme && theme.siteTheme !== 'classic')
        {
            document.documentElement.setAttribute('data-style', theme.name);
        } else
        {
            document.documentElement.removeAttribute('data-style');
        }
    }, [theme]);

    useEffect(() =>
    {
        const handleStorage = (e) =>
        {
            if (e.key === STORAGE_KEY && e.newValue)
            {
                try
                {
                    setThemeState({...DEFAULT_PERSONALIZATION, ...JSON.parse(e.newValue)});
                } catch (err)
                {
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const toggleDark = () =>
    {
        setThemeState(prev => ({...prev, isDark: !prev.isDark}));
    };

    const changeSiteTheme = (siteTheme) =>
    {
        setThemeState(prev => ({...prev, siteTheme}));
    };

    const changeProfileTheme = (profileTheme) =>
    {
        setThemeState(prev => ({...prev, profileTheme}));
    };

    return (
        <ThemeContext.Provider value={{theme, setThemeState, toggleDark, changeSiteTheme, changeProfileTheme}}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);