import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export default function StickerTooltip({ info, samples, isLoading, position, onMouseLeave, onInstall }) {
    const { t } = useTranslation();

    return (
        <div
            className="absolute z-[99999] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] p-[10px] w-[220px] rounded"
            style={{ top: position.y, left: position.x }}
            onMouseLeave={onMouseLeave}
        >
            {isLoading ? (
                <div className="text-[11px] text-text-muted italic">{t('common.loading')}</div>
            ) : info ? (
                <>
                    <div className="mb-[10px]">
                        <div className="flex flex-col">
                            <span className="font-bold text-[13px] text-text-main flex items-center gap-[5px]">
                                {info.title}
                                {info.is_published === false && (
                                    <span className="inline-block bg-theme-error text-white text-[10px] font-bold px-[5px] py-[2px] leading-none align-middle ml-[6px]">
                                        {t('sticker.pack_private')}
                                    </span>
                                )}
                            </span>
                            <span className="text-[11px] text-text-muted mt-[4px]">
                                {t('stickers.by_author')} {info.author}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-[5px] mb-[15px]">
                        {samples?.map(sample => (
                            <img key={sample.id} src={sample.url} alt={sample.shortcode} className="w-[40px] h-[40px] object-contain" />
                        ))}
                    </div>

                    <div className="flex flex-col">
                        {info.is_deleted ? (
                            <span className="text-text-muted text-[11px] italic text-center">
                                {t('stickers.pack_deleted')}
                            </span>
                        ) : (
                            <>
                                <Link to={`/stickers-shop?tab=catalog&search=${info.short_name}`} className="block w-full text-center py-[5px] px-[10px] border border-border text-text-main text-[11px] font-bold no-underline hover:bg-bg-page hover:text-theme-link transition-colors">
                                    {t('stickers.view_pack')}
                                </Link>
                                {!info.is_installed && (
                                    <button className="w-full mt-[10px] bg-theme-link text-white border-none py-[6px] px-[12px] font-bold text-[11px] cursor-pointer hover:opacity-90" onClick={onInstall}>
                                        {t('action.install')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}