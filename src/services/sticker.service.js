import fetchClient from '../api/client';

const StickerService = {
    getCatalog: (queryString = '') => {
        const prefix = queryString && !queryString.startsWith('?') ? '?' : '';
        return fetchClient(`/stickers/catalog${prefix}${queryString}`);
    },

    getMyPacks: () => fetchClient('/stickers/my'),

    createPack: (data) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('is_published', data.is_published ? '1' : '0');
        if (data.cover) formData.append('cover', data.cover);

        return fetchClient('/stickers/packs', {
            method: 'POST',
            body: formData
        });
    },

    updatePack: (shortName, data) => {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (data.title) formData.append('title', data.title);
        if (data.is_published !== undefined) formData.append('is_published', data.is_published ? '1' : '0');
        if (data.cover) formData.append('cover', data.cover);

        return fetchClient(`/stickers/packs/${shortName}`, {
            method: 'POST',
            body: formData
        });
    },

    deletePack: (shortName) => fetchClient(`/stickers/packs/${shortName}`, { method: 'DELETE' }),

    installPack: (shortName) => fetchClient(`/stickers/packs/${shortName}/install`, { method: 'POST' }),

    uninstallPack: (shortName) => fetchClient(`/stickers/packs/${shortName}/uninstall`, { method: 'DELETE' }),

    reorderPacks: (packShortNames) => fetchClient('/stickers/reorder-packs', {
        method: 'PUT',
        body: { packShortNames }
    }),

    addSticker: (shortName, data) => {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('shortcode', data.shortcode);
        if (data.keywords) formData.append('keywords', data.keywords);

        return fetchClient(`/stickers/packs/${shortName}/items`, {
            method: 'POST',
            body: formData
        });
    },

    updateSticker: (id, data) => {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (data.file) formData.append('file', data.file);
        if (data.shortcode) formData.append('shortcode', data.shortcode);
        if (data.keywords) formData.append('keywords', data.keywords);

        return fetchClient(`/stickers/${id}`, {
            method: 'POST',
            body: formData
        });
    },

    deleteSticker: (id) => fetchClient(`/stickers/${id}`, { method: 'DELETE' }),

    reorderStickers: (shortName, items) => fetchClient(`/stickers/packs/${shortName}/reorder`, {
        method: 'PUT',
        body: { items }
    }),

    getStickerInfo: (shortcode) => fetchClient(`/stickers/${shortcode}/info`),

    reportPack: (shortName, reason) => fetchClient(`/stickers/packs/${shortName}/report`, {
        method: 'POST',
        body: { reason }
    })
};

export default StickerService;