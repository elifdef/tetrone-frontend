import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';

import useEditorExtensions from './hooks/useEditorExtensions';
import useOnClickOutside from './hooks/useOnClickOutside';
import { decodeTipTapContent } from '../common/RichText';

import StyleMenu from './menus/StyleMenu';
import AttachmentMenu from './menus/AttachmentMenu';
import StickerPicker from './StickerPicker';
import { EmojiIcon } from '../ui/Icons';

export default function SmartEditor({
                                        value,
                                        onChange,
                                        placeholder = '',
                                        className = '',
                                        onEnter = null,
                                        preset = 'post',
                                        onAddPoll = null,
                                        stickerPacks = [],
                                        favoriteStickers = [],
                                        isStickersLoading = false,
                                    }) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const pickerRef = useRef(null);

    useOnClickOutside(pickerRef, (e) => {
        if (!e.target.closest('.tetrone-editor-side-btn')) setShowPicker(false);
    });

    const onEnterRef = useRef(onEnter);
    const onChangeRef = useRef(onChange);

    useEffect(() => { onEnterRef.current = onEnter; }, [onEnter]);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    const extensions = useEditorExtensions({ preset, placeholder, onEnterRef });

    // Декодуємо лише один раз при ініціалізації
    const initialContent = useMemo(() => decodeTipTapContent(value), []);

    const editor = useEditor({
        extensions,
        content: initialContent, // Передаємо початковий контент сюди!
        onUpdate: ({ editor }) => {
            onChangeRef.current(editor.getJSON());
        },
    }, [preset]); // Залежність тільки від preset

    // Синхронізація ззовні: якщо value приходить порожнім (після відправки)
    useEffect(() => {
        if (editor && (!value || Object.keys(value).length === 0) && !editor.isDestroyed) {
            editor.commands.clearContent();
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="relative flex flex-col w-full box-border">
            <StyleMenu editor={editor} />

            <div
                className={`relative flex flex-col bg-input-bg border border-input-border min-h-[120px] w-full box-border rounded-[2px] transition-colors focus-within:border-theme-link ${className}`}
                onClick={() => editor.chain().focus().run()}
            >
                <div className="flex-1 px-[15px] pt-[15px] pb-[40px] cursor-text overflow-y-auto">
                    <EditorContent
                        editor={editor}
                        className="outline-none h-full text-[13px] leading-[1.5] [&>div.ProseMirror]:min-h-[60px] [&>div.ProseMirror]:outline-none"
                    />
                </div>

                <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-[5px] pointer-events-none">
                    <div className="pointer-events-auto">
                        <AttachmentMenu editor={editor} onAddPoll={onAddPoll} />
                    </div>

                    <div className="pointer-events-auto">
                        <button
                            type="button"
                            className="tetrone-editor-side-btn bg-transparent border-none text-text-muted cursor-pointer p-[8px] flex items-center justify-center transition-colors hover:text-theme-link hover:bg-[rgba(255,255,255,0.05)] rounded-[2px] outline-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowPicker(!showPicker);
                            }}
                            title={t('editor.toolbar_stickers')}
                        >
                            <EmojiIcon width={20} height={20} />
                        </button>
                    </div>
                </div>
            </div>

            {showPicker && (
                <div className="absolute bottom-[calc(100%+5px)] right-0 z-[100] border border-border rounded-[2px] shadow-[0_4px_20px_rgba(0,0,0,0.4)]" ref={pickerRef}>
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
        </div>
    );
}