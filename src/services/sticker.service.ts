import fetchClient from '../api/client';
import { clearStickerPacksCache } from '../components/editor/StickerPicker';

export interface StickerPackPayload {
    title?: string;
    is_published?: boolean;
    cover?: File | Blob | null;
}

export interface StickerItemPayload {
    file?: File | Blob | null;
    shortcode?: string;
    keywords?: string;
}

const StickerService = {
    getCatalog: (queryString = '') => {
        const prefix = queryString && !queryString.startsWith('?') ? '?' : '';
        return fetchClient(`/stickers/catalog${prefix}${queryString}`);
    },

    getMyPacks: () => fetchClient('/stickers/my'),

    createPack: (data: Required<Pick<StickerPackPayload, 'title'>> & StickerPackPayload) => {
        clearStickerPacksCache();
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('is_published', data.is_published ? '1' : '0');
        if (data.cover) formData.append('cover', data.cover);

        return fetchClient('/stickers/packs', {
            method: 'POST',
            body: formData,
        });
    },

    updatePack: (shortName: string, data: StickerPackPayload) => {
        clearStickerPacksCache();
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (data.title) formData.append('title', data.title);
        if (data.is_published !== undefined) formData.append('is_published', data.is_published ? '1' : '0');
        if (data.cover) formData.append('cover', data.cover);

        return fetchClient(`/stickers/packs/${encodeURIComponent(shortName)}`, {
            method: 'POST',
            body: formData,
        });
    },

    deletePack: (shortName: string) => {
        clearStickerPacksCache();
        return fetchClient(`/stickers/packs/${encodeURIComponent(shortName)}`, { method: 'DELETE' });
    },

    installPack: (shortName: string) => {
        clearStickerPacksCache();
        return fetchClient(`/stickers/packs/${encodeURIComponent(shortName)}/install`, { method: 'POST' });
    },

    uninstallPack: (shortName: string) => {
        clearStickerPacksCache();
        return fetchClient(`/stickers/packs/${encodeURIComponent(shortName)}/uninstall`, {
            method: 'DELETE',
        });
    },

    reorderPacks: (packShortNames: string[]) => {
        clearStickerPacksCache();
        return fetchClient('/stickers/reorder-packs', {
            method: 'PUT',
            body: { packShortNames },
        });
    },

    addSticker: (shortName: string, data: Required<Pick<StickerItemPayload, 'file' | 'shortcode'>> & StickerItemPayload) => {
        const formData = new FormData();
        if (data.file) formData.append('file', data.file);
        formData.append('shortcode', data.shortcode);
        if (data.keywords) formData.append('keywords', data.keywords);

        return fetchClient(`/stickers/packs/${encodeURIComponent(shortName)}/items`, {
            method: 'POST',
            body: formData,
        });
    },

    updateSticker: (id: number | string, data: StickerItemPayload) => {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (data.file) formData.append('file', data.file);
        if (data.shortcode) formData.append('shortcode', data.shortcode);
        if (data.keywords) formData.append('keywords', data.keywords);

        return fetchClient(`/stickers/${id}`, {
            method: 'POST',
            body: formData,
        });
    },

    deleteSticker: (id: number | string) => fetchClient(`/stickers/${id}`, { method: 'DELETE' }),

    reorderStickers: (shortName: string, items: Array<number | string | Record<string, unknown>>) =>
        fetchClient(`/stickers/packs/${encodeURIComponent(shortName)}/reorder`, {
            method: 'PUT',
            body: { items },
        }),

    getStickerInfo: (shortcode: string) => fetchClient(`/stickers/${encodeURIComponent(shortcode)}/info`),

    reportPack: (shortName: string, reason: string) =>
        fetchClient(`/stickers/packs/${encodeURIComponent(shortName)}/report`, {
            method: 'POST',
            body: { reason },
        }),
};

export default StickerService;