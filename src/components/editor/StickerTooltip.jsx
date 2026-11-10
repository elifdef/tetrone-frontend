import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Button from "../ui/Button";
import StickerService from '../../services/sticker.service';
import { clearStickerPacksCache } from './StickerPicker';

export default function StickerTooltip({ info, samples, isLoading, position, onMouseLeave, onInstall }) {
    const { t } = useTranslation();
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    const packData = info?.pack || info || {};

    useEffect(() => {
        if (info) {
            const targetPack = info.pack || info;
            setIsInstalled(!!(targetPack.is_installed || targetPack.is_owner));
        }
    }, [info]);

    const handleInstallClick = async (e) => {
        e.stopPropagation();
        if (!packData?.short_name || isInstalling || isInstalled) return;

        setIsInstalling(true);
        try {
            await StickerService.installPack(packData.short_name);
            setIsInstalled(true);
            clearStickerPacksCache();
            if (onInstall) {
                onInstall(packData);
            }
        } catch (error) {
            setIsInstalled(true);
            clearStickerPacksCache();
        } finally {
            setIsInstalling(false);
        }
    };

    return (
        <div
            className="absolute z-[99999] bg-bg-box border border-border shadow-[0_4px_12px_rgba(0,0,0,0.3)] p-[8px] w-[180px] rounded-none font-tahoma text-[10px]"
            style={{ top: position.y, left: position.x }}
            onMouseLeave={onMouseLeave}
        >
            {isLoading ? (
                <div className="text-[10px] text-text-muted italic text-center py-[2px]">{t('common.loading')}</div>
            ) : info ? (
                <>
                    <div className="mb-[4px]">
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[11px] text-text-main truncate leading-tight" title={packData.title}>
                                {packData.title}
                            </span>
                            <div className="flex items-center justify-between gap-[4px] mt-[2px] text-[9px] text-text-muted">
                                <span className="truncate">{t('stickers.by_author')} {packData.author}</span>
                                {packData.is_published === false && (
                                    <span className="shrink-0 bg-theme-error text-white font-bold px-[3px] py-[1px] leading-none">
                                        {t('sticker.pack_private')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {samples && samples.length > 0 && (
                        <div className="flex flex-wrap gap-[2px] mb-[6px] justify-start bg-bg-page p-[3px] border border-border">
                            {samples.slice(0, 4).map(sample => (
                                <img key={sample.id} src={sample.url} alt={sample.shortcode} className="w-[32px] h-[32px] object-contain shrink-0" />
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col gap-[3px]">
                        {packData.is_deleted ? (
                            <span className="text-text-muted text-[10px] italic text-center">
                                {t('stickers.pack_deleted')}
                            </span>
                        ) : (
                            <>
                                <Link
                                    to={`/stickers-shop?tab=catalog&filter%5Bsearch%5D=${encodeURIComponent(packData.short_name)}`}
                                    className="block w-full text-center py-[3px] px-[4px] border border-border text-text-main text-[10px] font-bold no-underline hover:bg-bg-page hover:text-theme-link transition-colors"
                                >
                                    {t('stickers.view_pack')}
                                </Link>
                                {!isInstalled ? (
                                    <Button
                                        className="w-full bg-theme-link text-white border-none py-[3px] px-[6px] font-bold text-[10px] cursor-pointer hover:opacity-90 disabled:opacity-50"
                                        onClick={handleInstallClick}
                                        disabled={isInstalling}
                                    >
                                        {isInstalling ? t('common.loading') : t('action.install')}
                                    </Button>
                                ) : (
                                    <span className="text-[10px] text-theme-success font-bold text-center py-[1px]">
                                        {t('stickers.installed')}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}