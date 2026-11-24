import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';

import useEditorExtensions from './hooks/useEditorExtensions';
import useOnClickOutside from './hooks/useOnClickOutside';
import { decodeTipTapContent } from '../../utils/tiptapContent';
import { hasEditorFeature } from './presets';

import FloatingFormatMenu from './FloatingFormatMenu';
import StickerPicker, { type PickerStickerItem, type PickerStickerPack } from './StickerPicker';
import { EmojiIcon, FormatTextIcon } from '@ui/Icons';
import type { EditorPresetName, TipTapDoc } from '@/types/tiptap';

export interface SmartEditorProps {
    value?: TipTapDoc | Record<string, unknown> | null;
    onChange?: (doc: TipTapDoc) => void;
    placeholder?: string;
    className?: string;
    onEnter?: (() => void) | null;
    onPasteFiles?: ((files: File[]) => void) | null;
    preset?: EditorPresetName | string;
    stickerPacks?: PickerStickerPack[];
    favoriteStickers?: PickerStickerItem[];
    isStickersLoading?: boolean;
}

export default function SmartEditor({
    value,
    onChange,
    placeholder = '',
    className = '',
    onEnter = null,
    onPasteFiles = null,
    preset = 'post',
    stickerPacks = [],
    favoriteStickers = [],
    isStickersLoading = false,
}: SmartEditorProps) {
    const { t } = useTranslation();

    const initialContent = useMemo(() => decodeTipTapContent(value), [value]);

    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEmpty, setIsEmpty] = useState<boolean>(() => {
        if (!initialContent || typeof initialContent !== 'object') return true;
        const content = (initialContent as { content?: unknown }).content;
        return !Array.isArray(content) || content.length === 0;
    });

    const pickerRef = useRef<HTMLDivElement | null>(null);

    useOnClickOutside(pickerRef, (e) => {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('.tetrone-editor-side-btn')) {
            setShowPicker(false);
        }
    });

    const onEnterRef = useRef(onEnter);
    const onChangeRef = useRef(onChange);
    const onPasteFilesRef = useRef(onPasteFiles);

    useEffect(() => {
        onEnterRef.current = onEnter;
    }, [onEnter]);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);
    useEffect(() => {
        onPasteFilesRef.current = onPasteFiles;
    }, [onPasteFiles]);

    const extensions = useEditorExtensions({ preset, placeholder, onEnterRef });

    const editor = useEditor(
        {
            extensions,
            content: (initialContent as Record<string, unknown> | undefined) || undefined,
            editorProps: {
                handlePaste: (_view, event) => {
                    const files = event.clipboardData?.files;
                    if (files && files.length > 0 && onPasteFilesRef.current) {
                        onPasteFilesRef.current(Array.from(files));
                        return true;
                    }
                    return false;
                },
            },
            onCreate: ({ editor: instance }) => {
                setIsEmpty(instance.isEmpty);
            },
            onUpdate: ({ editor: instance }) => {
                onChangeRef.current?.(instance.getJSON() as TipTapDoc);
                setIsEmpty(instance.isEmpty);
            },
        },
        [preset]
    );

    useEffect(() => {
        if (!editor || editor.isDestroyed) return;

        const syncEmptyState = () => {
            setIsEmpty(editor.isEmpty);
        };

        editor.on('transaction', syncEmptyState);
        return () => {
            editor.off('transaction', syncEmptyState);
        };
    }, [editor]);

    useEffect(() => {
        if (!editor || editor.isDestroyed) return;

        if (!value || Object.keys(value).length === 0) {
            if (!editor.isEmpty) {
                editor.commands.clearContent(false);
            }
            return;
        }

        const decoded = decodeTipTapContent(value);
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(decoded)) {
            editor.commands.setContent(decoded as Record<string, unknown>, { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) return null;

    const canUseStickers = hasEditorFeature(preset, 'sticker');

    return (
        <div className={`relative flex flex-1 items-end w-full min-w-0 ${className}`}>
            <div
                className="flex-1 py-[10px] px-[8px] cursor-text max-h-[250px] overflow-y-auto relative min-w-0"
                onClick={() => editor.chain().focus().run()}
            >
                {isEmpty && (
                    <div className="absolute top-[10px] left-[8px] text-text-muted pointer-events-none text-[13px] italic whitespace-nowrap overflow-hidden text-ellipsis right-[8px]">
                        {placeholder}
                    </div>
                )}
                <EditorContent
                    editor={editor}
                    className="outline-none h-full text-[13px] leading-[1.5] break-words whitespace-pre-wrap [&>div.ProseMirror]:min-h-[20px] [&>div.ProseMirror]:outline-none [&>div.ProseMirror]:break-words"
                />
            </div>

            <div className="flex items-center gap-[6px] pb-[6px] pr-[6px] pl-[4px] shrink-0 self-end pointer-events-auto">
                <button
                    type="button"
                    className={`bg-transparent border-none cursor-pointer w-[24px] h-[24px] p-0 flex items-center justify-center transition-colors outline-none ${
                        showFormatMenu
                            ? 'text-theme-link bg-[rgba(0,102,204,0.1)]'
                            : 'text-text-muted hover:text-theme-link hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowFormatMenu(!showFormatMenu);
                    }}
                    title={t('editor.format_text')}
                >
                    <FormatTextIcon width={16} height={16} />
                </button>

                {canUseStickers && (
                    <button
                        type="button"
                        className={`tetrone-editor-side-btn bg-transparent border-none cursor-pointer w-[24px] h-[24px] p-0 flex items-center justify-center transition-colors outline-none ${
                            showPicker
                                ? 'text-theme-link bg-[rgba(0,102,204,0.1)]'
                                : 'text-text-muted hover:text-theme-link hover:bg-[rgba(255,255,255,0.05)]'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPicker(!showPicker);
                        }}
                        title={t('editor.toolbar_stickers')}
                    >
                        <EmojiIcon width={16} height={16} />
                    </button>
                )}
            </div>

            {canUseStickers && showPicker && (
                <div
                    className="absolute bottom-[calc(100%+5px)] right-0 z-[100] border border-border shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
                    ref={pickerRef}
                >
                    <StickerPicker
                        packs={stickerPacks}
                        favorites={favoriteStickers}
                        isLoading={isStickersLoading}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSelect={(s) => {
                            editor
                                .chain()
                                .focus()
                                .insertContent([
                                    {
                                        type: 'customSticker',
                                        attrs: {
                                            id: s.id,
                                            shortcode: s.shortcode,
                                            src: s.url || s.src || null,
                                            packName: s.pack_short_name || s.packName || null,
                                        },
                                    },
                                ])
                                .run();
                            setShowPicker(false);
                        }}
                    />
                </div>
            )}

            <FloatingFormatMenu
                isOpen={showFormatMenu}
                editor={editor}
                preset={preset}
                onClose={() => setShowFormatMenu(false)}
            />
        </div>
    );
}