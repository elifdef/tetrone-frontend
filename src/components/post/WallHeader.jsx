import { useTranslation } from 'react-i18next';

export default function WallHeader({ postsCount }) {
    const { t } = useTranslation();

    return (
        <div className="border-b border-border mb-[10px] pb-[3px] flex justify-between items-end">
            <span className="text-theme-link font-bold text-[13px]">{t('wall.title')}</span>

            <div className="flex items-center gap-[15px]">
                {/*TODO: реалізувати аналіз стіни*/}
                <button
                    type="button"
                    className="bg-transparent border border-theme-link text-theme-link text-[10px] font-bold uppercase px-[6px] py-[2px] cursor-pointer hover:bg-theme-link hover:text-white transition-colors"
                    onClick={() => alert('аналіз стіни')}
                >
                    0
                </button>

                <span className="text-text-muted text-[13px]">
                    {t('entities.post', { count: postsCount })}
                </span>
            </div>
        </div>
    );
}