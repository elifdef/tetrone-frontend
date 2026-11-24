import type { TipTapDoc } from '@/types/user';

export const toRichText = (text: TipTapDoc | string | null | undefined): TipTapDoc => {
    if (text && typeof text === 'object') {
        return text;
    }

    if (!text || typeof text !== 'string' || text.trim() === '') {
        return {
            type: 'doc',
            content: [],
        };
    }

    return {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text,
                    },
                ],
            },
        ],
    };
};