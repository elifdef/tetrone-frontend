import { SOUND_OPTIONS } from '../config.js'; // Зміни шлях, якщо config.js лежить в іншій папці

class AudioManager
{
    constructor()
    {
        this.context = null;
        this.buffers = new Map();
        this.isUnlocked = false;

        // Для збереження логіки зупинки
        this.currentSource = null;
        this.playTimeout = null;
    }

    unlock() {
        if (this.isUnlocked) {
            return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();

        // Створюємо осцилятор і вузол гучності
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        // Викручуємо гучність на 0 (абсолютна тиша)
        gainNode.gain.value = 0;

        // З'єднуємо: Осцилятор -> Гучність -> Динаміки
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.start(0);
        oscillator.stop(0.01);

        this.isUnlocked = true;
        this.preloadAllSounds();
    }

    preloadAllSounds()
    {
        SOUND_OPTIONS.forEach(option =>
        {
            if (option.value !== 0)
            {
                this.loadSound(option.value);
            }
        });
    }

    async loadSound(soundId)
    {
        if (this.buffers.has(soundId))
        {
            return this.buffers.get(soundId);
        }

        try
        {
            // Шлях точно як у твоєму старому класі
            const response = await fetch(`/sounds/notification_sound_${ soundId }.mp3`);
            if (!response.ok)
            {
                throw new Error(`HTTP error! status: ${ response.status }`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

            this.buffers.set(soundId, audioBuffer);

            return audioBuffer;
        } catch (error)
        {
            console.error(`Failed to load sound ${ soundId }:`, error);
            return null;
        }
    }

    async play(soundId)
    {
        if (!soundId || soundId === 'none' || soundId === 0)
        {
            return;
        }

        if (!this.isUnlocked || !this.context)
        {
            console.warn('autoplay not enabled');
            return;
        }

        // Зупиняємо попередній звук перед відтворенням нового
        this.stop();

        let buffer = this.buffers.get(soundId);

        // Якщо звук ще не завантажився у фоні, вантажимо його зараз
        if (!buffer)
        {
            buffer = await this.loadSound(soundId);
        }

        if (buffer)
        {
            // Створюємо "програвач" для цього звуку
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);

            source.start(0);
            this.currentSource = source;

            // Зберігаємо логіку зупинки через 5 секунд
            this.playTimeout = setTimeout(() =>
            {
                this.stop();
            }, 5000);
        }
    }

    stop()
    {
        // У Web Audio API метод stop() генерує помилку, якщо звук вже закінчився сам,
        // тому обгортаємо в try/catch або перевіряємо стан
        if (this.currentSource)
        {
            try
            {
                this.currentSource.stop();
            } catch (e)
            {
                // Ігноруємо: звук вже відіграв до кінця
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