import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Highlight } from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
const lowlight = createLowlight(common);
import { CustomStickerNode } from './CustomStickerNode';
import { decodeTipTapContent } from '../common/RichText';
import StickerPicker from './StickerPicker';
import stickerSuggestion from './StickerSuggestion';
import EditorMenu from './EditorMenu';
import EditorAttachmentMenu from './EditorAttachmentMenu.jsx';
import { SpoilerMark, FontSize, EnterHandler, StickerTrigger, PullquoteNode, DetailsNode, SummaryNode } from './extensions';
import mentionSuggestion from './mentionSuggestion';
import { EmojiIcon } from "../ui/Icons.jsx";

function Editor({
    value, onChange, placeholder = "", className = "", onEnter = null, preset = "post", onAddPoll = null
}) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);

    const onEnterRef = useRef(onEnter);
    const onChangeRef = useRef(onChange);

    useEffect(() => { onEnterRef.current = onEnter; }, [onEnter]);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    const extensions = useMemo(() => {
        const base = [
            StarterKit.configure({
                bulletList: false, orderedList: false, listItem: false,
                heading: preset === 'post' ? { levels: [1, 2, 3] } : false,
                codeBlock: false,
                blockquote: preset === 'post',
                horizontalRule: preset === 'post' // StarterKit обробить це сам
            }),
            FontFamily.configure(),
            Placeholder.configure({ placeholder }),
            SpoilerMark.configure(),
            EnterHandler.configure({ onEnterRef }),
            CustomStickerNode.configure(),
            StickerTrigger.configure({ suggestion: stickerSuggestion }),
            Mention.configure({ HTMLAttributes: { class: 'tetrone-user-mention' }, suggestion: mentionSuggestion }),
            Underline.configure(),
        ];

        if (preset === 'post') {
            base.push(
                TextStyle.configure(), Color.configure(), FontSize.configure(),
                Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' } }),
                BulletList.configure(), OrderedList.configure(), ListItem.configure(),
                TaskList.configure(), TaskItem.configure({ nested: true }),
                Table.configure({ resizable: true }), TableRow.configure(), TableHeader.configure(), TableCell.configure(),
                Subscript.configure(), Superscript.configure(), Highlight.configure({ multicolor: true }),
                PullquoteNode.configure(), DetailsNode.configure(), SummaryNode.configure(),
                CodeBlockLowlight.configure({ lowlight })
            );
        } else if (preset === 'message') {
            base.push(
                Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank' } }),
                BulletList.configure(), OrderedList.configure(), ListItem.configure()
            );
        }
        return base;
    }, [placeholder, preset]);

    // Декодуємо дані перед передачею в редактор
    const decodedValue = useMemo(() => decodeTipTapContent(value), [value]);

    const editor = useEditor({
        extensions,
        content: decodedValue, // Передаємо сюди розкодоване значення!
        onUpdate: ({ editor }) => { onChangeRef.current(editor.getJSON()); },
    }, [preset]);

    useEffect(() => {
        if (editor && (!decodedValue || Object.keys(decodedValue).length === 0) && !editor.isDestroyed) {
            editor.commands.clearContent();
        }
    }, [decodedValue, editor]);
    useEffect(() => {
        if (editor && (value === '' || value === null || (typeof value === 'object' && Object.keys(value).length === 0)) && !editor.isDestroyed) {
            editor.commands.clearContent();
        }
    }, [value, editor]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showPicker && pickerRef.current && !pickerRef.current.contains(event.target)) {
                if (!event.target.closest('.tetrone-editor-side-btn')) setShowPicker(false);
            }
        };
        if (showPicker) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker]);

    if (!editor) return null;

    return (
        <div className="tetrone-editor-outer-container">
            <EditorMenu editor={editor} />
            <div className={`tetrone-editor-row-wrapper ${className}`}>
                <div className="tetrone-editor-side-actions tetrone-editor-side-left">
                    <EditorAttachmentMenu editor={editor} onAddPoll={onAddPoll} />
                </div>
                <div className="tetrone-editor-input-area">
                    <EditorContent editor={editor} />
                </div>
                <div className="tetrone-editor-side-actions tetrone-editor-side-right">
                    <button type="button" className="tetrone-editor-side-btn" onClick={() => setShowPicker(!showPicker)} title={t('editor.toolbar_stickers')}>
                        <EmojiIcon />
                    </button>
                </div>
            </div>
            {showPicker && (
                <div className="tetrone-sticker-picker-container" ref={pickerRef}>
                    <StickerPicker onSelect={(s) => editor.chain().focus().insertContent([{ type: 'customSticker', attrs: { id: s.id, shortcode: s.shortcode, src: s.url || s.src, packName: s.pack_short_name || s.packName } }]).run()} />
                </div>
            )}
        </div>
    );
}

export default React.memo(Editor, (p, n) => p.placeholder === n.placeholder && p.preset === n.preset && (!p.value || Object.keys(p.value).length === 0) === (!n.value || Object.keys(n.value).length === 0));