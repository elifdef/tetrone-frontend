import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError } from "@common/Notify";
import { MAX_FILE_SIZE_KB } from "../../../config";
import { getMediaCategory, isForbiddenFile, isImageFile } from "@utils/fileTypes";

const stripExtension = (filename = '') => {
    const idx = filename.lastIndexOf('.');
    return idx > 0 ? filename.slice(0, idx) : filename;
};

export const usePostForm = (initialFilesCount = 0) => {
    const { t } = useTranslation();
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [pendingMediaSetup, setPendingMediaSetup] = useState([]);

    const addFiles = useCallback((filesList) => {
        if (!filesList || filesList.length === 0) return;

        const validFiles = [];
        let hasOversized = false;
        let hasForbidden = false;

        Array.from(filesList).forEach(file => {
            if (!file) return;

            if (isForbiddenFile(file)) {
                hasForbidden = true;
                return;
            }

            const isImage = isImageFile(file);
            const maxSize = isImage ? 10 * 1024 * 1024 : MAX_FILE_SIZE_KB * 1024;

            if (file.size > maxSize) {
                hasOversized = true;
            } else {
                validFiles.push(file);
            }
        });

        if (hasForbidden) {
            notifyError(t('error.not_allowed_types'));
        }

        if (hasOversized) {
            notifyError(t('error.file_too_large', { size: MAX_FILE_SIZE_KB / 1024 }));
        }

        if (initialFilesCount + files.length + validFiles.length > 10) {
            notifyError(t('error.max_files'));
            return;
        }

        if (validFiles.length === 0) return;

        const startIndex = files.length;
        const setupBatch = [];

        const newPreviews = validFiles.map((f, idx) => {
            let fileUrl = '';
            try {
                fileUrl = URL.createObjectURL(f);
            } catch (e) {
                console.error("Помилка створення URL", e);
            }

            const category = getMediaCategory(f);
            if (category === 'audio' || category === 'video') {
                setupBatch.push({
                    index: startIndex + idx,
                    category,
                    originalName: f.name || (category === 'video' ? 'video' : 'audio'),
                    defaultTitle: stripExtension(f.name || ''),
                    size: f.size || 0,
                });
            }

            return {
                url: fileUrl,
                type: f.type || '',
                name: f.name || 'Pasted_Image.png',
                size: f.size || 0,
                custom_title: '',
                custom_cover: null,
                custom_cover_url: '',
                is_spoiler: false,
                is_nsfw: false
            };
        });

        setFiles(prev => [...prev, ...validFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);

        if (setupBatch.length > 0) {
            setPendingMediaSetup(setupBatch);
        }
    }, [initialFilesCount, files.length, t]);

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
    
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    }, [addFiles]);

    const handleFileSelect = useCallback((input) => {
        if (!input) return;

        if (input.target && input.target.files) {
            addFiles(input.target.files);
            input.target.value = '';
        } else if (input instanceof FileList || Array.isArray(input)) {
            addFiles(input);
        } else if (input.files) {
            addFiles(input.files);
        }
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

    const updateMediaMeta = useCallback((indexToUpdate, patch) => {
        setFiles(prev => {
            const updated = [...prev];
            const target = updated[indexToUpdate];
            if (!target) return prev;
            if (Object.prototype.hasOwnProperty.call(patch, 'custom_title')) {
                target.custom_title = patch.custom_title || '';
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'custom_cover')) {
                target.custom_cover = patch.custom_cover || null;
            }
            return updated;
        });

        setPreviews(prev => {
            const updated = [...prev];
            const current = updated[indexToUpdate];
            if (!current) return prev;

            const nextItem = { ...current };

            if (Object.prototype.hasOwnProperty.call(patch, 'custom_title')) {
                nextItem.custom_title = patch.custom_title || '';
            }

            if (Object.prototype.hasOwnProperty.call(patch, 'custom_cover')) {
                if (nextItem.custom_cover_url && nextItem.custom_cover_url.startsWith('blob:')) {
                    URL.revokeObjectURL(nextItem.custom_cover_url);
                }
                nextItem.custom_cover = patch.custom_cover || null;
                nextItem.custom_cover_url = patch.custom_cover
                    ? URL.createObjectURL(patch.custom_cover)
                    : '';
            }

            updated[indexToUpdate] = nextItem;
            return updated;
        });
    }, []);

    const applyPendingMediaSetup = useCallback((updatesByIndex) => {
        Object.entries(updatesByIndex || {}).forEach(([idxStr, patch]) => {
            updateMediaMeta(Number(idxStr), patch);
        });
        setPendingMediaSetup([]);
    }, [updateMediaMeta]);

    const dismissPendingMediaSetup = useCallback(() => {
        setPendingMediaSetup([]);
    }, []);

    const removeFile = useCallback((indexToRemove) => {
        setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setPreviews(prev => {
            const updated = [...prev];
            const removedItem = updated.splice(indexToRemove, 1)[0];
            if (removedItem?.url && removedItem.url.startsWith('blob:')) {
                URL.revokeObjectURL(removedItem.url);
            }
            if (removedItem?.custom_cover_url && removedItem.custom_cover_url.startsWith('blob:')) {
                URL.revokeObjectURL(removedItem.custom_cover_url);
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
            if (p && p.custom_cover_url && p.custom_cover_url.startsWith('blob:')) URL.revokeObjectURL(p.custom_cover_url);
        });
        setPreviews([]);
        setPendingMediaSetup([]);
    }, [previews]);

    return {
        files, setFiles, previews, setPreviews, isDragging,
        pendingMediaSetup, applyPendingMediaSetup, dismissPendingMediaSetup,
        updateMediaMeta,
        handleDragOver, handleDragLeave, handleDrop,
        handleFileSelect, handlePaste, removeFile, replaceFile, clearFiles
    };
};