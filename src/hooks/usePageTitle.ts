import { useEffect } from 'react';
import { APP_NAME } from '../config';

export const usePageTitle = (title?: string | null): void => {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
        return () => {
            document.title = prevTitle;
        };
    }, [title]);
};