import { useTranslation } from 'react-i18next';

export default function WallHeader({ postsCount, isOwnProfile, showScheduled, onToggleScheduled }) {
    const { t } = useTranslation();

    return (
        <div className="border-b border-border mb-[10px] pb-[3px] flex justify-between items-end">
            <span className="text-theme-link font-bold text-[13px]">{t('wall.title')}</span>

            <div className="flex items-center gap-[15px]">
                <span className="text-text-muted text-[13px]">
                    {t('entities.post', { count: postsCount })}
                </span>
            </div>
        </div>
    );
}