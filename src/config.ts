export const APP_NAME: string = import.meta.env.VITE_APP_NAME || 'Tetrone';
export const API_URL: string = import.meta.env.VITE_API_URL || '/v1';
export const MAX_FILE_SIZE_KB: number = Number(import.meta.env.VITE_MAX_FILE_SIZE_KB) || 10240;
export const WS_URL: string = import.meta.env.VITE_WS_URL || '';
export const APP_ENV: string = import.meta.env.VITE_APP_ENV || 'prod';

export const userRole = {
    User: 0,
    Support: 1,
    Moderator: 2,
    Admin: 3,
    Owner: 4,
} as const;

export type UserRoleValue = (typeof userRole)[keyof typeof userRole];

export interface AppThemeOption {
    value: string;
    labelKey: string;
    descKey: string;
}

export const APP_THEMES: AppThemeOption[] = [
    { value: 'classic', labelKey: 'settings.theme.default', descKey: 'settings.theme.default_desc' },
    { value: 'xp', labelKey: 'settings.theme.xp', descKey: 'settings.theme.xp_desc' },
];

export interface SoundItem {
    id: number;
    label: string;
}

export interface SoundCategory {
    folder: string | null;
    categoryLabel: string | null;
    items: SoundItem[];
}

export const SOUNDS_CONFIG: SoundCategory[] = [
    {
        folder: null,
        categoryLabel: null,
        items: [{ id: 0, label: 'settings.sounds.silent' }],
    },
    {
        folder: 'longhorn',
        categoryLabel: 'settings.sounds.cat_longhorn',
        items: [
            { id: 1, label: 'settings.sounds.longhorn.like' },
            { id: 2, label: 'settings.sounds.longhorn.comment' },
            { id: 3, label: 'settings.sounds.longhorn.repost' },
            { id: 4, label: 'settings.sounds.longhorn.friend' },
            { id: 5, label: 'settings.sounds.longhorn.message' },
            { id: 6, label: 'settings.sounds.longhorn.post' },
            { id: 7, label: 'settings.sounds.longhorn.space' },
            { id: 8, label: 'settings.sounds.longhorn.call' },
        ],
    },
    {
        folder: 'meme',
        categoryLabel: 'settings.sounds.cat_meme',
        items: [
            { id: 9, label: 'settings.sounds.meme.faaaaah' },
            { id: 10, label: 'settings.sounds.meme.whistle' },
            { id: 11, label: 'settings.sounds.meme.vine_boom' },
            { id: 12, label: 'settings.sounds.meme.wrong_route' },
        ],
    },
];

export const PRIVACY = {
    CONTEXTS: [
        'profile',
        'avatar',
        'dob',
        'country',
        'friends',
        'message',
        'wall_post',
        'comment',
        'poll_vote',
        'reaction',
    ] as const,
    LEVELS: {
        EVERYONE: 0,
        FRIENDS: 1,
        NOBODY: 2,
        CUSTOM: 3,
    } as const,
};

export const getSoundPathById = (id: number | string | null | undefined): string | null => {
    const parsedId = Number(id);
    if (!parsedId || parsedId === 0) return null;

    for (const category of SOUNDS_CONFIG) {
        const sound = category.items.find((s) => s.id === parsedId);
        if (sound && category.folder) {
            return `/sounds/${category.folder}/notification_sound_${parsedId}.mp3`;
        }
    }
    return null;
};