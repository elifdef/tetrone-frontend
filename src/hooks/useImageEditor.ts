import { useState, useCallback } from 'react';

export const useImageEditor = <TFile = File>(
    onSaveSuccess?: (index: number | null, newFile: TFile) => void
) => {
    const [editingFile, setEditingFile] = useState<TFile | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const openEditor = useCallback((file: TFile, index: number | null = null) => {
        setEditingFile(file);
        setEditingIndex(index);
    }, []);

    const closeEditor = useCallback(() => {
        setEditingFile(null);
        setEditingIndex(null);
    }, []);

    const handleSave = useCallback(
        (newFile: TFile) => {
            if (onSaveSuccess) {
                onSaveSuccess(editingIndex, newFile);
            }
            closeEditor();
        },
        [onSaveSuccess, editingIndex, closeEditor]
    );

    return {
        isEditorOpen: Boolean(editingFile),
        editingFile,
        openEditor,
        closeEditor,
        handleSave,
    };
};