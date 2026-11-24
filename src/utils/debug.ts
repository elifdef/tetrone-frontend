import { useEffect, useState } from 'react';
import type { AttachmentItem } from '@/types/media';

export function isTetroneDebugEnabled(): boolean {
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

export function useTetroneDebug(): boolean {
    const [enabled, setEnabled] = useState<boolean>(isTetroneDebugEnabled);

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

export function extractDebugAttachments(payload: unknown): AttachmentItem[] {
    if (!payload || typeof payload !== 'object') return [];
    const record = payload as Record<string, unknown>;
    const candidate = (record.post ?? record.data ?? record) as Record<string, unknown>;
    const attachments = Array.isArray(candidate?.attachments) ? candidate.attachments : [];

    return attachments.filter((item): item is AttachmentItem => {
        if (!item || typeof item !== 'object') return false;
        const att = item as AttachmentItem;
        return ['image', 'video', 'audio'].includes(att.type) && Boolean(att.meta);
    });
}

export function openMediaDebugModal(attachment: AttachmentItem | null | undefined): void {
    if (!attachment) return;
    window.dispatchEvent(
        new CustomEvent<AttachmentItem>('tetrone:media-debug-open', { detail: attachment })
    );
}