import { useEffect, useState } from 'react';

export function isTetroneDebugEnabled() {
    if (typeof window === 'undefined') return false;
    try {
        const val = window.localStorage.getItem('tetrone_debug');
        if (val === null) return false;
        const normalized = val.trim().toLowerCase();
        return normalized !== '' && normalized !== '0' && normalized !== 'false' && normalized !== 'off';
    } catch {
        return false;
    }
}

export function useTetroneDebug() {
    const [enabled, setEnabled] = useState(isTetroneDebugEnabled);

    useEffect(() => {
        const sync = () => setEnabled(isTetroneDebugEnabled());
        window.addEventListener('storage', sync);
        window.addEventListener('focus', sync);
        window.addEventListener('tetrone:debug-changed', sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener('focus', sync);
            window.removeEventListener('tetrone:debug-changed', sync);
        };
    }, []);

    return enabled;
}

export function extractDebugAttachments(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const postObj = payload.post || payload.data || payload;
    const attachments = Array.isArray(postObj?.attachments) ? postObj.attachments : [];

    return attachments.filter(
        (a) => a && ['image', 'video', 'audio'].includes(a.type) && a.meta
    );
}

export function openMediaDebugModal(attachment) {
    if (!attachment) return;
    window.dispatchEvent(
        new CustomEvent('tetrone:media-debug-open', { detail: attachment })
    );
}