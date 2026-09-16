export const toRichText = (text) => {
    // Якщо це вже об'єкт (RichText), повертаємо його без змін
    if (text && typeof text === 'object') {
        return text;
    }

    // Якщо це не рядок або порожній рядок, повертаємо порожній документ Tiptap
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return {
            type: 'doc',
            content: []
        };
    }

    // Якщо це сирий текст, загортаємо його в параграф Tiptap
    return {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: text
                    }
                ]
            }
        ]
    };
};