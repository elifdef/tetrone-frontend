export const APP_NAME = import.meta.env.VITE_APP_NAME;
export const API_URL = import.meta.env.VITE_API_URL;
export const MAX_FILE_SIZE_KB = import.meta.env.VITE_MAX_FILE_SIZE_KB;
export const WS_URL = import.meta.env.VITE_WS_URL;
export const APP_ENV = import.meta.env.VITE_APP_ENV;

export const userRole = {
    User:      0,
    Support:   1,
    Moderator: 2,
    Admin:     3,
    Owner:     4
};

// Теми
export const APP_THEMES = [
    {value: 'classic', labelKey: 'settings.theme.default', descKey: 'settings.theme.default_desc'},
    {value: 'xp', labelKey: 'settings.theme.xp', descKey: 'settings.theme.xp_desc'}
];
// Категорії звуків
export const SOUNDS_CONFIG = [
    {
        folder:        null,
        categoryLabel: null,
        items:         [
            {id: 0, label: 'settings.sounds.silent'}
        ]
    },
    {
        folder:        'longhorn',
        categoryLabel: 'settings.sounds.cat_longhorn',
        items:         [
            {id: 1, label: 'settings.sounds.longhorn.like'},
            {id: 2, label: 'settings.sounds.longhorn.comment'},
            {id: 3, label: 'settings.sounds.longhorn.repost'},
            {id: 4, label: 'settings.sounds.longhorn.friend'},
            {id: 5, label: 'settings.sounds.longhorn.message'},
            {id: 6, label: 'settings.sounds.longhorn.post'},
            {id: 7, label: 'settings.sounds.longhorn.space'},
            {id: 8, label: 'settings.sounds.longhorn.call'},
        ]
    },
    {
        folder:        'meme',
        categoryLabel: 'settings.sounds.cat_meme',
        items:         [
            {id: 9, label: 'settings.sounds.meme.faaaaah'},
            {id: 10, label: 'settings.sounds.meme.whistle'},
            {id: 11, label: 'settings.sounds.meme.vine_boom'},
            {id: 12, label: 'settings.sounds.meme.wrong_route'},
        ]
    },
];

// Утиліта для генерації точного шляху до файлу
export const getSoundPathById = (id) =>
{
    if (id === 0) return null;

    for (const category of SOUNDS_CONFIG)
    {
        const sound = category.items.find(s => s.id === id);
        // Якщо знайшли звук — склеюємо папку та ім'я за стандартом
        if (sound && category.folder)
        {
            return `/sounds/${category.folder}/notification_sound_${id}.mp3`;
        }
    }
    return null;
};