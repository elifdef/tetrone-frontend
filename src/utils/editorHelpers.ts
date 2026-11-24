import {
    hasTipTapChildren,
    isTipTapDoc,
    isTipTapStickerNode,
    isTipTapTextNode,
    type TipTapAnyNode,
    type TipTapDoc,
    type TipTapNode,
} from '@/types/tiptap';

type DocLike = TipTapDoc | TipTapNode | Record<string, unknown> | null | undefined;

export const isEditorEmpty = (doc: DocLike): boolean => {
    if (!doc || typeof doc !== 'object') return true;

    let hasContent = false;
    const checkNode = (node: TipTapAnyNode): void => {
        if (isTipTapStickerNode(node)) {
            hasContent = true;
            return;
        }
        if (isTipTapTextNode(node) && node.text.trim() !== '') {
            hasContent = true;
            return;
        }
        if (hasTipTapChildren(node)) {
            for (const child of node.content) {
                checkNode(child);
                if (hasContent) return;
            }
        }
    };

    checkNode(doc as TipTapAnyNode);
    return !hasContent;
};

export const isOnlyStickers = (doc: DocLike): boolean => {
    if (!doc || typeof doc !== 'object') return false;

    let hasSticker = false;
    let hasText = false;
    const traverse = (node: TipTapAnyNode): void => {
        if (isTipTapTextNode(node) && node.text.trim() !== '') {
            hasText = true;
        }
        if (isTipTapStickerNode(node)) {
            hasSticker = true;
        }
        if (hasTipTapChildren(node)) {
            for (const child of node.content) {
                traverse(child);
            }
        }
    };

    traverse(doc as TipTapAnyNode);
    return hasSticker && !hasText;
};

export const extractPreviewText = (
    textStr: TipTapDoc | string | null | undefined,
    t: (key: string) => string = (key) => key
): string => {
    if (!textStr) return '';

    try {
        const parsed: unknown = typeof textStr === 'string' ? JSON.parse(textStr) : textStr;

        if (isTipTapDoc(parsed)) {
            let text = '';

            const extract = (node: TipTapAnyNode): void => {
                if (isTipTapTextNode(node) && node.text) {
                    text += node.text;
                }
                if (isTipTapStickerNode(node) && typeof node.attrs?.shortcode === 'string') {
                    text += `[${node.attrs.shortcode}] `;
                }
                if (hasTipTapChildren(node)) {
                    node.content.forEach(extract);
                }
            };

            extract(parsed);
            return text.trim() || (t ? t('messages.media') : 'Медіа');
        }

        return String(textStr);
    } catch {
        return String(textStr);
    }
};