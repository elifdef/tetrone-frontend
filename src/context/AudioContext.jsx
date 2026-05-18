import { createContext, useState, useEffect, useRef } from "react";

export const AudioContext = createContext();

const STORAGE_KEY = 'tetrone_audio_state';

export const AudioProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved).track : null;
        } catch {
            return null;
        }
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const channelRef = useRef(null);

    useEffect(() => {
        channelRef.current = new BroadcastChannel('tetrone_audio_sync');

        // Слухаємо команди від інших вкладок
        channelRef.current.onmessage = (event) => {
            if (event.data === 'PAUSE_AUDIO') {
                setIsPlaying(false); // Якщо інша вкладка почала грати, ми ставимо на паузу
            }
        };

        return () => {
            channelRef.current.close();
        };
    }, []);

    const playTrack = (track) => {
        if (currentTrack && currentTrack.id === track.id) {
            const newState = !isPlaying;
            setIsPlaying(newState);
            // Якщо ми зняли з паузи - кажемо іншим вкладкам STFU
            if (newState) {
                channelRef.current.postMessage('PAUSE_AUDIO');
            }
        } else {
            setCurrentTrack(track);
            setIsPlaying(true);
            channelRef.current.postMessage('PAUSE_AUDIO');
        }
    };

    const closePlayer = () => {
        setCurrentTrack(null);
        setIsPlaying(false);
    };

    return (
        <AudioContext.Provider value={{ currentTrack, isPlaying, setIsPlaying, playTrack, closePlayer, channelRef }}>
            {children}
        </AudioContext.Provider>
    );
};