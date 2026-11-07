import { useTranslation } from 'react-i18next';

export default function PackCard({ pack, onClick }) {
    const { t } = useTranslation();

    return (
        <div
            className="cursor-pointer flex flex-col items-center p-[8px] bg-transparent border border-transparent hover:bg-nav-hover hover:border-border transition-none group"
            onClick={() => onClick(pack)}
        >
            <div className="border border-border bg-bg-box p-[2px] mb-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <img
                    src={pack.cover_url}
                    alt={pack.title}
                    className="w-[100px] h-[100px] object-cover block"
                />
            </div>
            <div className="text-[11px] font-bold text-theme-link text-center w-full truncate group-hover:underline">
                {pack.title}
            </div>
            <div className="text-[10px] text-text-muted mt-[2px]">
                {pack.stickers_count} {t('stickers.stickers_count')}
            </div>
        </div>
    );
}