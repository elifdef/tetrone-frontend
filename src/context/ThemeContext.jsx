import {createContext, useState, useEffect, useContext} from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({children}) =>
{
    // 1. Дефолтна структура теми: ТЕПЕР СВІТЛА ЗА ЗАМОВЧУВАННЯМ
    const defaultTheme = {name: 'default', isDark: false};

    const [theme, setThemeState] = useState(() =>
    {
        const saved = localStorage.getItem('app_theme');
        if (saved)
        {
            try
            {
                return JSON.parse(saved);
            } catch (e)
            {
            }
        }

        // Міграція зі старого формату
        const oldDark = localStorage.getItem('dark_theme');
        if (oldDark !== null)
        {
            localStorage.removeItem('dark_theme');
            return {name: 'default', isDark: oldDark !== 'false'};
        }

        return defaultTheme;
    });

    useEffect(() =>
    {
        localStorage.setItem('app_theme', JSON.stringify(theme));

        // Ставимо на document.documentElement (тег <html>)
        if (theme.isDark)
        {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else
        {
            document.documentElement.removeAttribute('data-theme');
        }

        if (theme.name !== 'default')
        {
            document.documentElement.setAttribute('data-style', theme.name);
        } else
        {
            document.documentElement.removeAttribute('data-style');
        }
    }, [theme]);

    // Синхронізація між вкладками браузера
    useEffect(() =>
    {
        const handleStorage = (e) =>
        {
            if (e.key === 'app_theme')
            {
                try
                {
                    setThemeState(JSON.parse(e.newValue));
                } catch (err)
                {
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Зручні функції для зміни теми
    const toggleDark = () =>
    {
        setThemeState(prev => ({...prev, isDark: !prev.isDark}));
    };

    const changeThemeName = (name) =>
    {
        setThemeState(prev => ({...prev, name}));
    };

    return (
        <ThemeContext.Provider value={{theme, setThemeState, toggleDark, changeThemeName}}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);