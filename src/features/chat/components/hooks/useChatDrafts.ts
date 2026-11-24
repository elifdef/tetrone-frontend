import { useState, useMemo, useCallback, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import type { ChatAttachmentPreview } from '@/types/chat';
import type { TipTapDoc } from '@/types/user';

export type ChatDraftText = TipTapDoc | string | null;
export type ChatFileChangeEvent =
    | ChangeEvent<HTMLInputElement>
    | { target: { files: FileList | File[] | null; value?: string } };

export interface UseChatDraftsResult {
    draftsMap: Record<string, ChatDraftText>;
    draftFilesMap: Record<string, ChatAttachmentPreview[]>;
    text: ChatDraftText;
    setText: Dispatch<SetStateAction<ChatDraftText>>;
    files: ChatAttachmentPreview[];
    setFiles: Dispatch<SetStateAction<ChatAttachmentPreview[]>>;
    handleFileChange: (e: ChatFileChangeEvent) => void;
    handleAddGraffitiFile: (dataUrl: string) => void;
    handleRemoveFile: (index: number) => void;
}

export function useChatDrafts(activeChatSlug: string | null): UseChatDraftsResult {
    const [draftsMap, setDraftsMap] = useState<Record<string, ChatDraftText>>({});
    const [draftFilesMap, setDraftFilesMap] = useState<Record<string, ChatAttachmentPreview[]>>({});

    const text = useMemo<ChatDraftText>(() => {
        if (!activeChatSlug) return null;
        return draftsMap[activeChatSlug] ?? null;
    }, [draftsMap, activeChatSlug]);

    const setText: Dispatch<SetStateAction<ChatDraftText>> = useCallback(
        (valOrUpdater) => {
            if (!activeChatSlug) return;
            setDraftsMap((prev) => {
                const currentVal = prev[activeChatSlug] ?? null;
                const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(currentVal) : valOrUpdater;
                return { ...prev, [activeChatSlug]: nextVal };
            });
        },
        [activeChatSlug]
    );

    const files = useMemo<ChatAttachmentPreview[]>(() => {
        if (!activeChatSlug) return [];
        return draftFilesMap[activeChatSlug] ?? [];
    }, [draftFilesMap, activeChatSlug]);

    const setFiles: Dispatch<SetStateAction<ChatAttachmentPreview[]>> = useCallback(
        (valOrUpdater) => {
            if (!activeChatSlug) return;
            setDraftFilesMap((prev) => {
                const currentVal = prev[activeChatSlug] ?? [];
                const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(currentVal) : valOrUpdater;
                return { ...prev, [activeChatSlug]: nextVal };
            });
        },
        [activeChatSlug]
    );

    const handleFileChange = useCallback(
        (e: ChatFileChangeEvent) => {
            if (e.target.files && e.target.files.length > 0) {
                const incoming: ChatAttachmentPreview[] = Array.from(e.target.files).map((rawFile) => {
                    const objectUrl = URL.createObjectURL(rawFile);
                    return {
                        rawFile,
                        name: rawFile.name,
                        type: rawFile.type || 'application/octet-stream',
                        size: rawFile.size,
                        url: objectUrl,
                        previewUrl: objectUrl,
                    };
                });
                setFiles((prev) => [...prev, ...incoming]);
                if ('value' in e.target) {
                    e.target.value = '';
                }
            }
        },
        [setFiles]
    );

    const handleAddGraffitiFile = useCallback(
        (dataUrl: string) => {
            const graffitiAttachment: ChatAttachmentPreview = {
                name: `graffiti_${Date.now()}.png`,
                type: 'image/png',
                url: dataUrl,
                previewUrl: dataUrl,
            };
            setFiles((prev) => [...prev, graffitiAttachment]);
        },
        [setFiles]
    );

    const handleRemoveFile = useCallback(
        (index: number) => {
            setFiles((prev) => prev.filter((_, i) => i !== index));
        },
        [setFiles]
    );

    return {
        draftsMap,
        draftFilesMap,
        text,
        setText,
        files,
        setFiles,
        handleFileChange,
        handleAddGraffitiFile,
        handleRemoveFile,
    };
}