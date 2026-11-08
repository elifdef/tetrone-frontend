import { Node, mergeAttributes } from '@tiptap/core';

export const CustomStickerNode = Node.create({
    name: 'customSticker',
    group: 'inline',
    inline: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            shortcode: {
                default: null,
                parseHTML: element => element.getAttribute('alt')?.replace(/^:|:$/g, '') || element.getAttribute('data-shortcode'),
            },
            src: {
                default: null,
                parseHTML: element => element.getAttribute('src'),
            },
            packName: {
                default: null,
                parseHTML: element => element.getAttribute('data-pack-name'),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'img.micro-sticker' }];
    },

    renderHTML({ HTMLAttributes }) {
        let packName = HTMLAttributes.packName || HTMLAttributes['data-pack-name'];

        if (!packName && HTMLAttributes.src) {
            const match = HTMLAttributes.src.match(/\/storage\/emojis\/([^/]+)\//);
            if (match) {
                packName = match[1];
            }
        }

        return ['img', mergeAttributes(HTMLAttributes, {
            class: 'micro-sticker cursor-pointer hover:opacity-80 transition-opacity',
            src: HTMLAttributes.src,
            alt: `:${HTMLAttributes.shortcode}:`,
            'data-shortcode': HTMLAttributes.shortcode || '',
            'data-pack-name': packName || ''
        })];
    },
});