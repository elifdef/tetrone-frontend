import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError } from "../../common/Notify";
import { MAX_FILE_SIZE_KB } from "../../../config";

export const usePostForm = (initialFilesCount = 0) => {
    const { t } = useTranslation();
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const addFiles = useCallback((filesList) => {
        if (!filesList || filesList.length === 0) return;

        const validFiles = [];
        let hasOversized = false;

        Array.from(filesList).forEach(file => {
            if (!file) return;

            // ФІКС 1: Додаємо допуск. Якщо це зображення з буфера, воно може бути великим.
            // Щоб юзер міг його обрізати в редакторі, ми пропускаємо зображення до 10MB.
            const isImage = file.type.startsWith('image/');
            const maxSize = isImage ? 10 * 1024 * 1024 : MAX_FILE_SIZE_KB * 1024; 

            if (file.size > maxSize) {
                hasOversized = true;
            } else {
                validFiles.push(file);
            }
        });

        if (hasOversized) {
            notifyError(t('error.file_too_large', { size: MAX_FILE_SIZE_KB / 1024 }));
        }

        if (initialFilesCount + files.length + validFiles.length > 10) {
            notifyError(t('error.max_files'));
            return;
        }

        if (validFiles.length === 0) return;

        setFiles(prev => [...prev, ...validFiles]);

        const newPreviews = validFiles.map(f => {
            let fileUrl = '';
            try {
                fileUrl = URL.createObjectURL(f);
            } catch (e) {
                console.error("Помилка створення URL", e);
            }
            return {
                url: fileUrl,
                type: f.type || '',
                name: f.name || 'Pasted_Image.png',
                is_spoiler: false,
                is_nsfw: false
            };
        });

        setPreviews(prev => [...prev, ...newPreviews]);
    }, [initialFilesCount, files.length, t]);

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
    
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    }, [addFiles]);

    const handleFileSelect = useCallback((e) => {
        if (e.target.files) addFiles(e.target.files);
        e.target.value = '';
    }, [addFiles]);

    // ФІКС 2: Ідеальний перехват Ctrl+V
    const handlePaste = useCallback((e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const pastedFiles = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) pastedFiles.push(file);
            }
        }
        
        if (pastedFiles.length > 0) {
            e.preventDefault();
            e.stopPropagation(); // Не даємо Tiptap-у перехопити картинку!
            addFiles(pastedFiles);
        }
    }, [addFiles]);

    const removeFile = useCallback((indexToRemove) => {
        setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setPreviews(prev => {
            const updated = [...prev];
            const removedItem = updated.splice(indexToRemove, 1)[0];
            if (removedItem && removedItem.url) {
                URL.revokeObjectURL(removedItem.url);
            }
            return updated;
        });
    }, []);

    // ФІКС 3: Коректна заміна відредагованого файлу
    const replaceFile = useCallback((indexToReplace, newFile) => {
        setFiles(prev => {
            const newFiles = [...prev];
            if (!newFiles[indexToReplace]) return prev;
            
            const oldFlags = { 
                is_nsfw: newFiles[indexToReplace].is_nsfw || false, 
                is_spoiler: newFiles[indexToReplace].is_spoiler || false
            };
            newFile.is_nsfw = oldFlags.is_nsfw;
            newFile.is_spoiler = oldFlags.is_spoiler;
            
            newFiles[indexToReplace] = newFile;
            return newFiles;
        });

        setPreviews(prev => {
            const updated = [...prev];
            if (!updated[indexToReplace]) return prev;

            if (updated[indexToReplace].url) {
                URL.revokeObjectURL(updated[indexToReplace].url);
            }
            
            updated[indexToReplace] = {
                ...updated[indexToReplace],
                url: URL.createObjectURL(newFile),
                name: newFile.name || 'Edited_Image.jpg'
            };
            return updated;
        });
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
        previews.forEach(p => {
            if (p && p.url && p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
        });
        setPreviews([]);
    }, [previews]);

    return {
        files, previews, isDragging,
        handleDragOver, handleDragLeave, handleDrop,
        handleFileSelect, handlePaste, removeFile, replaceFile, clearFiles
    };
};