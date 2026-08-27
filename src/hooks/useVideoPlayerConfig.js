import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useVideoPlayerConfig = (src, type, provider, poster) => {
    const { t } = useTranslation();

    const options = useMemo(() => ({
        controls: [
            'play-large', 'play', 'progress', 'current-time', 'duration',
            'mute', 'volume', 'settings', 'pip', 'fullscreen'
        ],
        settings: ['quality', 'speed', 'loop'],
        loop: { active: false },
        speed: { selected: 1, options: [0.5, 1, 1.25, 1.5, 2, 3, 4] },
        loadSprite: true,
        autopause: false,
        i18n: {
            restart: t('video.restart'),
            rewind: t('video.rewind'),
            play: t('video.play'),
            pause: t('video.pause'),
            fastForward: t('video.forward'),
            seek: t('video.seek'),
            played: t('video.played'),
            buffered: t('video.buffered'),
            currentTime: t('video.currentTime'),
            duration: t('video.duration'),
            volume: t('video.volume'),
            mute: t('video.mute'),
            unmute: t('video.unmute'),
            enableCaptions: t('video.enableCaptions'),
            disableCaptions: t('video.disableCaptions'),
            enterFullscreen: t('video.enterFullscreen'),
            exitFullscreen: t('video.exitFullscreen'),
            frameTitle: t('video.frameTitle'),
            captions: t('video.captions'),
            settings: t('video.settings'),
            speed: t('video.speed'),
            normal: t('video.normal'),
            quality: t('video.quality'),
            loop: t('video.loop'),
        }
    }), [t]);

    const source = useMemo(() => ({
        type: 'video',
        sources: [{
            src,
            provider,
            type: provider === 'youtube' ? undefined : type
        }],
        poster,
    }), [src, type, provider, poster]);

    return { options, source };
};