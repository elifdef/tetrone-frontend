import { createContext, useState, useEffect, useRef } from "react";

export const AudioContext = createContext();

const STORAGE_KEY = 'tetrone_audio_state';

export const AudioProvider = ({ children }) => {
    const audioRef = useRef(new Audio());
    const channelRef = useRef(null);

    const [currentTrack, setCurrentTrack] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved).track : null;
        } catch {
            return null;
        }
    });

    const [isPlaying, setIsPlaying] = useState(false);

    // Зберігаємо поточний трек при його зміні
    useEffect(() => {
        if (currentTrack) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ track: currentTrack }));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [currentTrack]);

    useEffect(() => {
        channelRef.current = new BroadcastChannel('tetrone_audio_sync');

        channelRef.current.onmessage = (event) => {
            if (event.data === 'PAUSE_AUDIO') {
                setIsPlaying(false);
            }
        };

        return () => {
            channelRef.current.close();
        };
    }, []);

    const playTrack = (track, sourceInfo = null) => {
        const resolvedSource = sourceInfo || track.sourceInfo || (track.post_id ? { type: 'post', id: track.post_id, url: `/post/${track.post_id}` } : null);
        
        const fullTrackData = {
            ...track,
            sourceInfo: resolvedSource
        };

        if (currentTrack && currentTrack.id === track.id) {
            const newState = !isPlaying;
            setIsPlaying(newState);
            if (newState) {
                channelRef.current?.postMessage('PAUSE_AUDIO');
            }
        } else {
            setCurrentTrack(fullTrackData);
            setIsPlaying(true);
            channelRef.current?.postMessage('PAUSE_AUDIO');
        }
    };

    const closePlayer = () => {
        setCurrentTrack(null);
        setIsPlaying(false);
    };

    return (
        <AudioContext.Provider value={{ audioRef, currentTrack, isPlaying, setIsPlaying, playTrack, closePlayer, channelRef }}>
            {children}
        </AudioContext.Provider>
    );
};