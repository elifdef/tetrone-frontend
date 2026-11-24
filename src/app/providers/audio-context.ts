import { createContext, useContext, type ChangeEvent, type RefObject } from 'react';

export interface AudioSourceInfo {
    type?: 'post' | 'chat' | string;
    id?: number | string;
    url?: string;
}

export interface AudioTrackData {
    id?: number | string;
    file_url?: string;
    url?: string;
    original_name?: string;
    file_name?: string;
    file_size?: number;
    cover_url?: string | null;
    post_id?: number | string | null;
    sourceInfo?: AudioSourceInfo | null;
}

export interface AudioContextValue {
    audioRef: RefObject<HTMLAudioElement | null>;
    currentTrack: AudioTrackData | null;
    isPlaying: boolean;
    isReady: boolean;
    hasError: boolean;
    playbackRate: number;
    isLooping: boolean;
    volume: number;
    playTrack: (track: AudioTrackData, sourceInfo?: AudioSourceInfo | null) => void;
    playPauseClick: () => void;
    toggleSpeed: () => void;
    toggleLoop: () => void;
    handleVolumeChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleClose: () => void;
    closePlayer: () => void;
    channelRef: RefObject<BroadcastChannel | null>;
}

const emptyAudioRef: RefObject<HTMLAudioElement | null> = { current: null };
const emptyChannelRef: RefObject<BroadcastChannel | null> = { current: null };

export const AudioContext = createContext<AudioContextValue>({
    audioRef: emptyAudioRef,
    currentTrack: null,
    isPlaying: false,
    isReady: false,
    hasError: false,
    playbackRate: 1,
    isLooping: false,
    volume: 1,
    playTrack: () => {},
    playPauseClick: () => {},
    toggleSpeed: () => {},
    toggleLoop: () => {},
    handleVolumeChange: () => {},
    handleClose: () => {},
    closePlayer: () => {},
    channelRef: emptyChannelRef,
});

export const useAudio = () => useContext(AudioContext);
