class AudioManager
{
    constructor()
    {
        this.audio = new Audio();
        this.audio.volume = 1;
        this.isUnlocked = false;
        this.playTimeout = null;
    }

    unlock()
    {
        if (this.isUnlocked)
        {
            return;
        }

        // Замість muted = true використовуємо volume = 0
        const prevVolume = this.audio.volume;
        this.audio.volume = 0;

        this.audio.src = '/sounds/notification_sound_1.mp3';

        this.audio.play().then(() =>
        {
            this.audio.pause();
            this.audio.currentTime = 0;

            this.audio.volume = prevVolume;
            this.isUnlocked = true;
        }).catch(err =>
        {
            this.audio.volume = prevVolume;
            console.log("error" + err);
        });
    }

    play(soundId)
    {
        if (!soundId || soundId === 'none' || soundId === 0)
        {
            return;
        }

        this.audio.pause();
        this.audio.currentTime = 0;
        if (this.playTimeout)
        {
            clearTimeout(this.playTimeout);
        }

        this.audio.src = `/sounds/notification_sound_${ soundId }.mp3`;
        this.audio.muted = false;

        this.audio.play().then(() =>
        {
            this.playTimeout = setTimeout(() =>
            {
                this.audio.pause();
                this.audio.currentTime = 0;
            }, 5000);
        }).catch(e =>
        {
            console.warn('Автоплей заблоковано:', e);
        });
    }

    stop()
    {
        this.audio.pause();
        this.audio.currentTime = 0;
        if (this.playTimeout)
        {
            clearTimeout(this.playTimeout);
        }
    }
}

export const audioManager = new AudioManager();