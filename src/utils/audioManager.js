import {SOUNDS_CONFIG, getSoundPathById} from '../config.js';

class AudioManager
{
    constructor()
    {
        this.context = null;
        this.buffers = new Map();
        this.isUnlocked = false;
        this.currentSource = null;
        this.playTimeout = null;
    }

    unlock()
    {
        if (this.isUnlocked) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();

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

    preloadAllSounds()
    {
        SOUNDS_CONFIG.forEach(category =>
        {
            category.items.forEach(sound =>
            {
                if (sound.id !== 0) this.loadSound(sound.id);
            });
        });
    }

    async loadSound(soundId)
    {
        const parsedId = Number(soundId);
        if (parsedId === 0) return null;

        if (this.buffers.has(parsedId))
        {
            return this.buffers.get(parsedId);
        }

        const filePath = getSoundPathById(parsedId);
        if (!filePath) return null;

        try
        {
            const response = await fetch(filePath);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

            this.buffers.set(parsedId, audioBuffer);
            return audioBuffer;
        } catch (error)
        {
            console.error(`Failed to load sound ${parsedId}:`, error);
            return null;
        }
    }

    async play(soundId)
    {
        const parsedId = Number(soundId);
        if (!parsedId || parsedId === 0) return;
        if (!this.isUnlocked || !this.context) return;

        this.stop();
        let buffer = this.buffers.get(parsedId) || await this.loadSound(parsedId);

        if (buffer)
        {
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            source.start(0);
            this.currentSource = source;

            this.playTimeout = setTimeout(() => this.stop(), 5000);
        }
    }

    stop()
    {
        if (this.currentSource)
        {
            try
            {
                this.currentSource.stop();
            } catch (e)
            {
            }
            this.currentSource = null;
        }
        if (this.playTimeout)
        {
            clearTimeout(this.playTimeout);
            this.playTimeout = null;
        }
    }
}

export const audioManager = new AudioManager();