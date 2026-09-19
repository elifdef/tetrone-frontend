import { useTranslation } from 'react-i18next';
import { ClockIcon } from '../ui/Icons';

export default function WallHeader({ postsCount, showScheduled, onToggleScheduled }) {
    const { t } = useTranslation();

    return (
        <div className="border-b border-border mb-[10px] pb-[3px] flex justify-between items-end">
            <span className="text-theme-link font-bold text-[13px]">{t('wall.title')}</span>

            <div className="flex items-center gap-[15px]">
                {onToggleScheduled && (
                    <button
                        type="button"
                        onClick={onToggleScheduled}
                        className={`bg-transparent border-none cursor-pointer flex items-center gap-[6px] text-[12px] transition-colors outline-none ${showScheduled ? 'text-theme-link font-bold' : 'text-text-muted hover:text-theme-link'}`}
                        title={showScheduled ? t('wall.tab_all') : t('wall.tab_scheduled')}
                    >
                        <ClockIcon width={14} height={14} />
                        {showScheduled ? t('wall.tab_all') : t('wall.tab_scheduled')}
                    </button>
                )}

                <span className="text-text-muted text-[13px]">
                    {t('entities.post', { count: postsCount })}
                </span>
            </div>
        </div>
    );
}