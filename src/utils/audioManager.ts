import { SOUNDS_CONFIG, getSoundPathById } from '../config';

type WindowWithWebkitAudio = Window & {
    webkitAudioContext?: typeof AudioContext;
};

class AudioManager {
    private context: AudioContext | null = null;
    private buffers = new Map<number, AudioBuffer>();
    private isUnlocked = false;
    private currentSource: AudioBufferSourceNode | null = null;
    private playTimeout: ReturnType<typeof setTimeout> | null = null;

    unlock(): void {
        if (this.isUnlocked) return;
        const AudioCtx = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
        if (!AudioCtx) return;

        this.context = new AudioCtx();

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        gainNode.gain.value = 0;

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        oscillator.start(0);
        oscillator.stop(0.01);

        this.isUnlocked = true;
        this.preloadAllSounds();
    }

    preloadAllSounds(): void {
        SOUNDS_CONFIG.forEach((category) => {
            category.items.forEach((sound) => {
                if (sound.id !== 0) {
                    void this.loadSound(sound.id);
                }
            });
        });
    }

    async loadSound(soundId: number | string): Promise<AudioBuffer | null> {
        const parsedId = Number(soundId);
        if (!parsedId || parsedId === 0 || !this.context) return null;

        const cached = this.buffers.get(parsedId);
        if (cached) {
            return cached;
        }

        const filePath = getSoundPathById(parsedId);
        if (!filePath) return null;

        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

            this.buffers.set(parsedId, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound ${parsedId}:`, error);
            return null;
        }
    }

    async play(soundId: number | string): Promise<void> {
        const parsedId = Number(soundId);
        if (!parsedId || parsedId === 0) return;
        if (!this.isUnlocked || !this.context) return;

        this.stop();
        const buffer = this.buffers.get(parsedId) || (await this.loadSound(parsedId));

        if (buffer && this.context) {
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            source.start(0);
            this.currentSource = source;

            this.playTimeout = setTimeout(() => this.stop(), 5000);
        }
    }

    stop(): void {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch {
                // Source may already be stopped
            }
            this.currentSource = null;
        }
        if (this.playTimeout) {
            clearTimeout(this.playTimeout);
            this.playTimeout = null;
        }
    }
}

export const audioManager = new AudioManager();