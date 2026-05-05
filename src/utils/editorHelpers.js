export const isEditorEmpty = (doc) => {
    if (!doc || typeof doc !== 'object') return true;

    let hasContent = false;
    const checkNode = (node) => {
        if (node.type === 'customSticker') { hasContent = true; return; }
        if (node.type === 'text' && node.text && node.text.trim() !== '') { hasContent = true; return; }
        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) {
                checkNode(child);
                if (hasContent) return;
            }
        }
    };

    checkNode(doc);
    return !hasContent;
};

export const isOnlyStickers = (doc) => {
    if (!doc || typeof doc !== 'object') return false;

    let hasSticker = false;
    let hasText = false;
    const traverse = (node) => {
        if (node.type === 'text' && node.text && node.text.trim() !== '') hasText = true;
        if (node.type === 'customSticker') hasSticker = true;
        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) traverse(child);
        }
    };

    traverse(doc);
    return hasSticker && !hasText;
};

export const extractPreviewText = (textStr, t = (key) => key) => {
    if (!textStr) return '';

    try {
        // Перевіряємо, чи це рядок JSON, чи вже готовий об'єкт
        const parsed = typeof textStr === 'string' ? JSON.parse(textStr) : textStr;

        // Якщо це структура TipTap
        if (parsed?.type === 'doc') {
            let text = '';

            const extract = (node) => {
                // Якщо це звичайний текст - додаємо його
                if (node.type === 'text' && node.text) {
                    text += node.text;
                }
                // Якщо це стікер - виводимо його шорткод (наприклад, [cat])
                if (node.type === 'customSticker' && node.attrs?.shortcode) {
                    text += '[' + node.attrs.shortcode + '] ';
                }
                // Якщо є вкладені елементи (наприклад, параграфи) - йдемо вглиб
                if (node.content && Array.isArray(node.content)) {
                    node.content.forEach(extract);
                }
            };

            extract(parsed);

            // Якщо після парсингу тексту немає (наприклад, тільки картинка), повертаємо fallback
            return text.trim() || (t ? t('messages.media') : 'Медіа');
        }

        // Якщо це не JSON TipTap, а звичайний рядок
        return String(textStr);
    } catch {
        // Якщо JSON.parse впав (це був просто сирий текст, а не JSON)
        return String(textStr);
    }
};