import {
    hasTipTapChildren,
    isTipTapDoc,
    isTipTapStickerNode,
    isTipTapTextNode,
    type TipTapDoc,
    type TipTapNode,
} from '@/types/tiptap';

export interface TipTapFeatures {
    hasTable: boolean;
    hasCode: boolean;
    hasTask: boolean;
    hasDetails: boolean;
}

export const isTipTapJson = (content: unknown): content is TipTapDoc | string => {
    if (!content) return false;
    if (isTipTapDoc(content)) return true;
    if (typeof content === 'string') {
        const trimmed = content.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                return isTipTapDoc(JSON.parse(trimmed));
            } catch {
                return false;
            }
        }
    }
    return false;
};
export const toTipTapDoc = (content?: TipTapDoc | string | null): TipTapDoc | null => {
    if (!content) return null;
    if (isTipTapDoc(content)) return content;
    if (typeof content === 'string' && isTipTapJson(content)) {
        try {
            const parsed: unknown = JSON.parse(content);
            if (isTipTapDoc(parsed)) return parsed;
        } catch {
            // fallback to plain text node
        }
    }
    const str = String(content).trim();
    if (!str) return null;
    return {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [{ type: 'text', text: str }],
            },
        ],
    };
};

export const hasRichContent = (content?: TipTapDoc | string | null): boolean => {
    const doc = toTipTapDoc(content);
    if (!doc) return false;

    let found = false;
    const checkNodes = (nodes: TipTapNode[]) => {
        for (const node of nodes) {
            if (isTipTapTextNode(node) && node.text.trim().length > 0) {
                found = true;
                return;
            }
            if (['customSticker', 'image', 'table', 'codeBlock', 'horizontalRule', 'details'].includes(node.type)) {
                found = true;
                return;
            }
            if (hasTipTapChildren(node)) {
                checkNodes(node.content);
                if (found) return;
            }
        }
    };
    checkNodes(doc.content);
    return found;
};

export const detectTipTapFeatures = (content?: TipTapDoc | string | null): TipTapFeatures => {
    const doc = toTipTapDoc(content);
    const features: TipTapFeatures = { hasTable: false, hasCode: false, hasTask: false, hasDetails: false };
    if (!doc) {
        return features;
    }

    const walk = (nodes: TipTapNode[]) => {
        nodes.forEach((node) => {
            if (node.type === 'table') features.hasTable = true;
            if (node.type === 'codeBlock') features.hasCode = true;
            if (node.type === 'taskList') features.hasTask = true;
            if (node.type === 'details') features.hasDetails = true;
            if (hasTipTapChildren(node)) walk(node.content);
        });
    };
    walk(doc.content);
    return features;
};

export const getPlainText = (content?: TipTapDoc | string | null): string => {
    if (!content) return '';
    try {
        const parsed: unknown =
            typeof content === 'string' && isTipTapJson(content) ? JSON.parse(content) : content;
        if (!isTipTapDoc(parsed)) {
            return String(content);
        }

        let text = '';
        const extract = (nodes: TipTapNode[]) => {
            nodes.forEach((node) => {
                if (isTipTapTextNode(node)) {
                    text += node.text;
                } else if (isTipTapStickerNode(node)) {
                    const shortcode = typeof node.attrs?.shortcode === 'string' ? node.attrs.shortcode : 'sticker';
                    text += ` :${shortcode}: `;
                } else if (node.type === 'paragraph' || node.type === 'heading') {
                    text += ' ';
                }
                if (hasTipTapChildren(node)) {
                    extract(node.content);
                }
            });
        };
        extract(parsed.content);
        return text.trim() || '';
    } catch {
        return String(content);
    }
};

export const parseRichText = (content?: TipTapDoc | string | null): TipTapDoc | null => {
    if (!content) return null;
    return toTipTapDoc(content);
};
