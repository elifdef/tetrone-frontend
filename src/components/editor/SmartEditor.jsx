import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';

import useEditorExtensions from './hooks/useEditorExtensions';
import useOnClickOutside from './hooks/useOnClickOutside';
import { decodeTipTapContent } from '../common/RichText';

import FloatingFormatMenu from './FloatingFormatMenu';
import StickerPicker from './StickerPicker';
import { EmojiIcon, FormatTextIcon } from '../ui/Icons';

export default function SmartEditor({
    value,
    onChange,
    placeholder = '',
    className = '',
    onEnter = null,
    preset = 'post',
    stickerPacks = [],
    favoriteStickers = [],
    isStickersLoading = false
}) {
    const { t } = useTranslation();

    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEmpty, setIsEmpty] = useState(true);

    const pickerRef = useRef(null);

    useOnClickOutside(pickerRef, (e) => {
        if (!e.target.closest('.tetrone-editor-side-btn')) setShowPicker(false);
    });

    const onEnterRef = useRef(onEnter);
    const onChangeRef = useRef(onChange);

    useEffect(() => { onEnterRef.current = onEnter; }, [onEnter]);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    const extensions = useEditorExtensions({ preset, placeholder, onEnterRef });
    const initialContent = useMemo(() => decodeTipTapContent(value), []);

    const editor = useEditor({
        extensions,
        content: initialContent,
        onUpdate: ({ editor }) => {
            onChangeRef.current(editor.getJSON());
            setIsEmpty(editor.isEmpty);
        },
    }, [preset]);

    useEffect(() => {
        if (editor && (!value || Object.keys(value).length === 0) && !editor.isDestroyed) {
            editor.commands.clearContent();
            setIsEmpty(true);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className={`relative flex flex-1 items-end w-full min-w-0 ${className}`}>

            <div className="flex-1 py-[10px] px-[8px] cursor-text max-h-[250px] overflow-y-auto relative min-w-0" onClick={() => editor.chain().focus().run()}>
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
                    className={`bg-transparent border-none cursor-pointer w-[24px] h-[24px] p-0 flex items-center justify-center transition-colors outline-none ${showFormatMenu ? 'text-theme-link bg-[rgba(0,102,204,0.1)]' : 'text-text-muted hover:text-theme-link hover:bg-[rgba(255,255,255,0.05)]'}`}
                    onClick={(e) => { e.stopPropagation(); setShowFormatMenu(!showFormatMenu); }}
                    title={t('editor.format_text')}
                >
                    <FormatTextIcon width={16} height={16} />
                </button>

                <button
                    type="button"
                    className={`tetrone-editor-side-btn bg-transparent border-none cursor-pointer w-[24px] h-[24px] p-0 flex items-center justify-center transition-colors outline-none ${showPicker ? 'text-theme-link bg-[rgba(0,102,204,0.1)]' : 'text-text-muted hover:text-theme-link hover:bg-[rgba(255,255,255,0.05)]'}`}
                    onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
                    title={t('editor.toolbar_stickers')}
                >
                    <EmojiIcon width={16} height={16} />
                </button>
            </div>

            {showPicker && (
                <div className="absolute bottom-[calc(100%+5px)] right-0 z-[100] border border-border shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden" ref={pickerRef}>
                    <StickerPicker
                        packs={stickerPacks}
                        favorites={favoriteStickers}
                        isLoading={isStickersLoading}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSelect={(s) => {
                            editor.chain().focus().insertContent([{
                                type: 'customSticker',
                                attrs: {
                                    id: s.id,
                                    shortcode: s.shortcode,
                                    src: s.url || s.src,
                                    packName: s.pack_short_name || s.packName
                                }
                            }]).run();
                            setShowPicker(false);
                        }}
                    />
                </div>
            )}

            <FloatingFormatMenu isOpen={showFormatMenu} editor={editor} onClose={() => setShowFormatMenu(false)} />
        </div>
    );
}