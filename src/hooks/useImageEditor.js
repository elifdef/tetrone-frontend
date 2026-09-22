import { useState, useCallback } from 'react';

export const useImageEditor = (onSaveSuccess) => {
    const [editingFile, setEditingFile] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const openEditor = useCallback((file, index = null) => {
        setEditingFile(file);
        setEditingIndex(index);
    }, []);

    const closeEditor = useCallback(() => {
        setEditingFile(null);
        setEditingIndex(null);
    }, []);

    const handleSave = useCallback((newFile) => {
        if (onSaveSuccess) {
            // ФІКС 1: Передаємо аргументи у правильному порядку (спочатку індекс, потім файл)
            onSaveSuccess(editingIndex, newFile);
        }
        closeEditor();
    }, [onSaveSuccess, editingIndex, closeEditor]);

    return {
        isEditorOpen: !!editingFile,
        editingFile,
        openEditor,
        closeEditor,
        handleSave
    };
};