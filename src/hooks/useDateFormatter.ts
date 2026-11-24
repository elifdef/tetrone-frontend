import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, isToday, isYesterday, type Locale } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';

export interface DateFormatOptions {
    withTime?: boolean;
    useRelative?: boolean;
    forceYear?: boolean;
}

const locales: Record<string, Locale> = {
    ua: uk,
    uk: uk,
    'uk-UA': uk,
    en: enUS,
    us: enUS,
    gb: enUS,
};

export const useDateFormatter = () => {
    const { t, i18n } = useTranslation();

    const formatDate = useCallback(
        (dateString: string | Date | null | undefined, options: DateFormatOptions = {}): string => {
            if (!dateString || dateString === t('profile.not_specified')) {
                return t('profile.not_specified');
            }

            const date = dateString instanceof Date ? dateString : new Date(dateString);
            const locale = locales[i18n.language] || enUS;

            const config: Required<DateFormatOptions> = {
                withTime: true,
                useRelative: true,
                forceYear: false,
                ...options,
            };

            const timeStr = config.withTime ? format(date, 'HH:mm') : '';

            if (config.useRelative) {
                if (isToday(date)) return t('date.today_at', { time: timeStr });
                if (isYesterday(date)) return t('date.yesterday_at', { time: timeStr });
            }

            const isCurrentYear = date.getFullYear() === new Date().getFullYear();
            const showYear = config.forceYear || !isCurrentYear;

            const pattern = showYear ? 'd MMMM yyyy' : 'd MMMM';
            const datePart = format(date, pattern, { locale });

            if (!config.withTime) return datePart;

            return `${datePart} ${t('date.at')} ${timeStr}`;
        },
        [t, i18n.language]
    );

    return formatDate;
};