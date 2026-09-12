import {useTranslation} from 'react-i18next';

export default function PackCard({pack, onClick})
{
    const {t} = useTranslation();

    return (
        <div
            className="cursor-pointer flex flex-col items-center p-[10px] bg-bg-page border border-transparent hover:border-border hover:bg-nav-hover rounded-[3px] transition-none"
            onClick={() => onClick(pack)}
        >
            <img
                src={pack.cover_url}
                alt={pack.title}
                className="w-[100px] h-[100px] object-cover mb-[6px] border border-border p-[2px] bg-bg-box"
            />
            <div className="text-[12px] font-bold text-theme-link text-center w-full truncate">
                {pack.title}
            </div>
            <div className="text-[11px] text-text-muted mt-[2px]">
                {pack.stickers_count} {t('stickers.stickers_count')}
            </div>
        </div>
    );
}