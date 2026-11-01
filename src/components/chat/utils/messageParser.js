export const isTipTapJson = (content) => {
    if (!content) return false;
    if (typeof content === 'object') {
        return content.type === 'doc' && Array.isArray(content.content);
    }
    if (typeof content === 'string') {
        const trimmed = content.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return Boolean(parsed && parsed.type === 'doc' && Array.isArray(parsed.content));
            } catch {
                return false;
            }
        }
    }
    return false;
};

export const toTipTapDoc = (content = null) => {
    if (!content) return null;
    if (typeof content === 'object' && content.type === 'doc') {
        return content;
    }
    if (typeof content === 'string' && isTipTapJson(content)) {
        try {
            return JSON.parse(content);
        } catch {
            // fallback
        }
    }
    const str = String(content).trim();
    if (!str) return null;
    return {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [{ type: 'text', text: str }]
            }
        ]
    };
};

export const hasRichContent = (content) => {
    const doc = toTipTapDoc(content);
    if (!doc || !Array.isArray(doc.content)) return false;

    let found = false;
    const checkNodes = (nodes) => {
        for (const node of nodes) {
            if (node.type === 'text' && node.text && node.text.trim().length > 0) {
                found = true;
                return;
            }
            if (node.type === 'customSticker' || node.type === 'image') {
                found = true;
                return;
            }
            if (Array.isArray(node.content)) {
                checkNodes(node.content);
                if (found) return;
            }
        }
    };
    checkNodes(doc.content);
    return found;
};

export const getPlainText = (content) => {
    if (!content) return '';
    try {
        const parsed = typeof content === 'string' && isTipTapJson(content) ? JSON.parse(content) : content;
        if (typeof parsed !== 'object' || !parsed.content) return String(content);

        let text = '';
        const extract = (nodes) => {
            nodes.forEach(node => {
                if (node.type === 'text') text += node.text;
                else if (node.type === 'customSticker') text += ` :${node.attrs?.shortcode || 'sticker'}: `;
                else if (node.type === 'paragraph') text += ' ';
                if (node.content) extract(node.content);
            });
        };
        extract(parsed.content);
        return text.trim() || '';
    } catch {
        return String(content);
    }
};

export const parseRichText = (content) => {
    if (!content) return null;
    return toTipTapDoc(content);
};