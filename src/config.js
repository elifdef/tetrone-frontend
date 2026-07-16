export const APP_NAME = import.meta.env.VITE_APP_NAME;
export const API_URL = import.meta.env.VITE_API_URL;
export const MAX_FILE_SIZE_KB = import.meta.env.VITE_MAX_FILE_SIZE_KB;
export const WS_URL = import.meta.env.VITE_WS_URL;

export const userRole = {
    User: 0,
    Support: 1,
    Moderator: 2,
    Admin: 3,
    Creator: 4
};

export const SOUND_OPTIONS = [
    { value: 0, label: 'settings.sounds.silent' },
    { value: 1, label: 'settings.sounds.default' },
    { value: 2, label: 'settings.sounds.whistle' },
    { value: 3, label: 'settings.sounds.vine_boom' },
    // { value: 4, label: 'settings.sounds.soft_ping' },
    // { value: 5, label: 'settings.sounds.alert' }
];