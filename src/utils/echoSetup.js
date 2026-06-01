import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const createEchoInstance = (token) => {
    if (!token) return null;

    return new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT,
        wssPort: import.meta.env.VITE_REVERB_PORT,
        forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            }
        }
    });
};