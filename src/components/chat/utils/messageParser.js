// Безпечно перевіряє, чи є рядок валідним TipTap JSON
export const isTipTapJson = (content) => {
    if (!content) return false;
    if (typeof content === 'object') {
        return content.type === 'doc' && Array.isArray(content.content);
    }
    if (typeof content === 'string' && content.startsWith('{') && content.endsWith('}')) {
        try {
            const parsed = JSON.parse(content);
            return parsed && parsed.type === 'doc' && Array.isArray(parsed.content);
        } catch (e) {
            return false;
        }
    }
    return false;
};

// Витягує чистий текст для прев'ю (інбокс, закріпи, заголовки)
export const getPlainText = (content) => {
    if (!content) return '';
    try {
        const parsed = typeof content === 'string' && isTipTapJson(content) ? JSON.parse(content) : content;
        if (typeof parsed !== 'object' || !parsed.content) return String(content);

        let text = '';
        const extract = (nodes) => {
            nodes.forEach(node => {
                if (node.type === 'text') text += node.text;
                else if (node.type === 'paragraph') text += ' ';
                if (node.content) extract(node.content);
            });
        };
        extract(parsed.content);
        return text.trim() || '';
    } catch (e) {
        return String(content);
    }
};

// Парсить JSON, якщо це об'єкт TipTap, для передачі у компонент <RichText>
export const parseRichText = (content) => {
    if (!content) return null;
    if (typeof content === 'object') return content;
    if (isTipTapJson(content)) {
        try {
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }
    return null;
};