import { Node, mergeAttributes } from '@tiptap/core';

export const CustomStickerNode = Node.create({
    name: 'customSticker',
    group: 'inline',
    inline: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            shortcode: { default: null },
            src: { default: null },
            packName: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'img.micro-sticker' }]; // ФІКС
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(HTMLAttributes, {
            class: 'micro-sticker', // ФІКС
            src: HTMLAttributes.src,
            alt: `:${HTMLAttributes.shortcode}:`,
            'data-pack-name': HTMLAttributes.packName
        })];
    },
});