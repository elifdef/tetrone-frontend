import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import StickerService from '../../services/sticker.service';

// щоб не довбати сервер до долбаного отказа своїми стікерами
const stickerInfoCache = {};

export default function StickerTooltip({ shortcode, position, onMouseLeave })
{
    const { t } = useTranslation();
    const [info, setInfo] = useState(null);
    const [samples, setSamples] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() =>
    {
        let isMounted = true;

        const fetchInfo = async () =>
        {
            if (stickerInfoCache[shortcode])
            {
                setInfo(stickerInfoCache[shortcode].pack);
                setSamples(stickerInfoCache[shortcode].samples);
                setIsLoading(false);
                return;
            }

            try
            {
                const response = await StickerService.getStickerInfo(shortcode);
                if (isMounted && response)
                {
                    stickerInfoCache[shortcode] = response;
                    setInfo(response.pack);
                    setSamples(response.samples);
                }
            } catch (error)
            {
                // error handling
            } finally
            {
                if (isMounted)
                {
                    setIsLoading(false);
                }
            }
        };

        if (shortcode)
        {
            fetchInfo();
        }

        return () =>
        {
            isMounted = false;
        };
    }, [shortcode]);

    const handleInstall = async () =>
    {
        if (!info?.pack?.short_name)
        {
            return;
        }
        try
        {
            const response = await StickerService.installPack(info.pack.short_name);
            if (response)
            {
                const updatedInfo = {
                    ...info,
                    pack: { ...info.pack, is_installed: true }
                };
                stickerInfoCache[shortcode] = updatedInfo;
                setInfo(updatedInfo);
            }
        } catch (error)
        {
            // error handling
        }
    };

    return (
        <div
            className="tetrone-sticker-hover-tooltip"
            style={ { top: position.y, left: position.x } }
            onMouseLeave={ onMouseLeave }
        >
            { isLoading ? (
                <div className="tetrone-sticker-tooltip-loader">{ t('common.loading') }</div>
            ) : info ? (
                <>
                    <div className="tetrone-sticker-tooltip-header">
                        <div className="tetrone-sticker-tooltip-pack-info">
                            <span className="tetrone-sticker-tooltip-title">
                                { info.title }
                                { info.is_published === false && (
                                    <span className="tetrone-badge tetrone-bg-danger">
                                        { t('sticker.pack_private') }
                                    </span>
                                ) }
                            </span>
                            <span className="tetrone-sticker-tooltip-author">
        { t('stickers.by_author') } { info.author }
    </span>
                        </div>

                    </div>

                    <div className="tetrone-sticker-tooltip-samples">
                        { samples.map(sample => (
                            <img
                                key={ sample.id }
                                src={ sample.url }
                                alt={ sample.shortcode }
                                className="tetrone-sticker-tooltip-sample-img"
                            />
                        )) }
                    </div>

                    <div className="tetrone-sticker-tooltip-actions">
                        { info.is_deleted ? (
                            <span className="tetrone-text-muted tetrone-sticker-tooltip-deleted-text">
                                { t('stickers.pack_deleted') }
                            </span>
                        ) : (
                            <>
                                <Link
                                    to={ `/stickers-shop?tab=catalog&search=${ info.short_name }` }
                                    className="tetrone-btn  tetrone-btn-ghost tetrone-btn-full-width"
                                >
                                    { t('stickers.view_pack') }
                                </Link>

                                { !info.is_installed && (
                                    <button
                                        className="tetrone-btn  tetrone-btn-full-width tetrone-mt-4"
                                        onClick={ handleInstall }
                                    >
                                        { t('action.install') }
                                    </button>
                                ) }
                            </>
                        ) }
                    </div>
                </>
            ) : null }
        </div>
    );
}