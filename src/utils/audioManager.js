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

        // 1. М'ютимо звук, щоб юзер абсолютно нічого не почув під час розблокування
        this.audio.muted = true;

        // Використовуємо існуючий файл для "холостого" запуску
        this.audio.src = '/sounds/notification_sound_1.mp3';

        this.audio.play().then(() =>
        {
            this.audio.pause();
            this.audio.currentTime = 0;

            // 2. Повертаємо звук назад для майбутніх реальних сповіщень
            this.audio.muted = false;
            this.isUnlocked = true;
        }).catch(err =>
        {
            // Якщо сталася помилка (наприклад, кліку ще не було),
            // обов'язково знімаємо м'ют, щоб наступна спроба спрацювала
            this.audio.muted = false;
        });
    }

    play(soundId)
    {
        // Додано soundId === 0, бо ти казав, що 0 - це "без звуку"
        if (!soundId || soundId === 'none' || soundId === 0)
        {
            return;
        }

        // ЗУПИНЯЄМО попередній звук
        this.audio.pause();
        this.audio.currentTime = 0;
        if (this.playTimeout)
        {
            clearTimeout(this.playTimeout);
        }

        // ВМИКАЄМО новий
        // ВАЖЛИВО: слово /public/ в URL не пишеться! React бере файли з public напряму.
        // Я додав підкреслення _, якщо в тебе файли називаються notification_sound_1.mp3
        this.audio.src = `/sounds/notification_sound_${soundId}.mp3`;

        // На всякий випадок переконуємося, що звук не вимкнений
        this.audio.muted = false;

        this.audio.play().then(() =>
        {
            // Ставимо запобіжник: через 5 секунд жорстко вимикаємо
            this.playTimeout = setTimeout(() =>
            {
                this.audio.pause();
                this.audio.currentTime = 0;
            }, 5000);
        }).catch(e =>
        {
            // console.warn('Автоплей заблоковано:', e);
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