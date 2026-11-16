import { useState, useMemo, useCallback } from 'react';

export function useChatDrafts(activeChatSlug) {
    const [draftsMap, setDraftsMap] = useState({});
    const [draftFilesMap, setDraftFilesMap] = useState({});

    const text = useMemo(() => {
        if (!activeChatSlug) return null;
        return draftsMap[activeChatSlug] ?? null;
    }, [draftsMap, activeChatSlug]);

    const setText = useCallback((valOrUpdater) => {
        if (!activeChatSlug) return;
        setDraftsMap(prev => {
            const currentVal = prev[activeChatSlug] ?? null;
            const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(currentVal) : valOrUpdater;
            return { ...prev, [activeChatSlug]: nextVal };
        });
    }, [activeChatSlug]);

    const files = useMemo(() => {
        if (!activeChatSlug) return [];
        return draftFilesMap[activeChatSlug] ?? [];
    }, [draftFilesMap, activeChatSlug]);

    const setFiles = useCallback((valOrUpdater) => {
        if (!activeChatSlug) return;
        setDraftFilesMap(prev => {
            const currentVal = prev[activeChatSlug] ?? [];
            const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(currentVal) : valOrUpdater;
            return { ...prev, [activeChatSlug]: nextVal };
        });
    }, [activeChatSlug]);

    const handleFileChange = useCallback((e) => {
        if (e.target.files?.length > 0) {
            const incoming = Array.from(e.target.files).map(rawFile => ({
                rawFile,
                name: rawFile.name,
                type: rawFile.type || 'application/octet-stream',
                url: URL.createObjectURL(rawFile),
                previewUrl: URL.createObjectURL(rawFile)
            }));
            setFiles(prev => [...prev, ...incoming]);
            e.target.value = null;
        }
    }, [setFiles]);

    const handleAddGraffitiFile = useCallback((dataUrl) => {
        const graffitiAttachment = {
            name: `graffiti_${Date.now()}.png`,
            type: 'image/png',
            url: dataUrl,
            previewUrl: dataUrl
        };
        setFiles(prev => [...prev, graffitiAttachment]);
    }, [setFiles]);

    const handleRemoveFile = useCallback((index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, [setFiles]);

    return {
        draftsMap,
        draftFilesMap,
        text,
        setText,
        files,
        setFiles,
        handleFileChange,
        handleAddGraffitiFile,
        handleRemoveFile
    };
}