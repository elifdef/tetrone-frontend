import { Node, mergeAttributes } from '@tiptap/core';

export const CustomStickerNode = Node.create({
    name: 'customSticker',
    group: 'inline',
    inline: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            id: {
                default: null,
            },
            shortcode: {
                default: null,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute('alt')?.replace(/^:|:$/g, '') ||
                    element.getAttribute('data-shortcode'),
            },
            src: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('src'),
            },
            packName: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('data-pack-name'),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'img.micro-sticker' }];
    },

    renderHTML({ HTMLAttributes }) {
        let packName = (HTMLAttributes.packName || HTMLAttributes['data-pack-name']) as string | undefined;

        if (!packName && typeof HTMLAttributes.src === 'string') {
            const match = HTMLAttributes.src.match(/\/storage\/emojis\/([^/]+)\//);
            if (match) {
                packName = match[1];
            }
        }

        const shortcode = typeof HTMLAttributes.shortcode === 'string' ? HTMLAttributes.shortcode : '';

        return [
            'img',
            mergeAttributes(HTMLAttributes, {
                class: 'micro-sticker cursor-pointer hover:opacity-80 transition-opacity',
                src: HTMLAttributes.src,
                alt: `:${shortcode}:`,
                'data-shortcode': shortcode,
                'data-pack-name': packName || '',
            }),
        ];
    },
});