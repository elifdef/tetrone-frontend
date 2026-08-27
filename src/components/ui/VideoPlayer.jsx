import React, { useEffect, useRef } from 'react';
import { Plyr } from "plyr-react";
import "plyr-react/plyr.css";
import "./VideoPlayer.css"; // Підключаємо наш окремий файл зі стилями
import { useVideoPlayerConfig } from "../../hooks/useVideoPlayerConfig";

const VideoPlayer = React.memo(function VideoPlayer({
                                                        src,
                                                        type = 'video/mp4',
                                                        provider = 'html5',
                                                        poster = '',
                                                        className = ''
                                                    }) {
    const wrapperRef = useRef(null);
    const plyrRef = useRef(null);

    // Отримуємо конфіг з нашого хука (Швидкість і Loop там уже є)
    const { options, source } = useVideoPlayerConfig(src, type, provider, poster);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        const player = plyrRef.current?.plyr;
                        if (player && player.playing) {
                            player.pause();
                        }
                    }
                });
            },
            { threshold: 0.2 }
        );

        const handleKeyDown = (e) => {
            const activeTag = document.activeElement.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            const player = plyrRef.current?.plyr;
            if (!player) return;

            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                player.playing ? player.pause() : player.play();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                player.forward(5);
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                player.rewind(5);
            }
        };

        wrapper.addEventListener('keydown', handleKeyDown);
        observer.observe(wrapper);

        return () => {
            wrapper.removeEventListener('keydown', handleKeyDown);
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={wrapperRef}
            tabIndex="0"
            className={`app-video-player focus:outline-none ${className}`}
        >
            <Plyr
                ref={plyrRef}
                source={source}
                options={options}
            />
        </div>
    );
});

export default VideoPlayer;