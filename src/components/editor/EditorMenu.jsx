import React, { useCallback } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { useTranslation } from 'react-i18next';
import {
    FormatBoldIcon, FormatItalicIcon, FormatUnderlineIcon,
    FormatStrikeIcon, FormatLinkIcon, EyeOffIcon,
    TableAddRowIcon, TableAddColIcon, TableDelRowIcon, TableDelColIcon, TableMergeIcon
} from '../ui/Icons';

export default function EditorMenu({ editor }) {
    const { t } = useTranslation();
    if (!editor) return null;

    const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px'];
    const ALLOWED_FONTS = ['Tahoma', 'Arial', 'Times New Roman', 'Verdana', 'Georgia', 'Courier New'];

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt(t('editor.enter_link'), previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor, t]);

    const supportsStyles = typeof editor.commands.setColor === 'function';

    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150, animation: 'shift-away', maxWidth: 'none' }} className="tetrone-bubble-menu-modern">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`tetrone-bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`} title="Bold">
                <FormatBoldIcon />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`tetrone-bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`} title="Italic">
                <FormatItalicIcon />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`tetrone-bubble-btn ${editor.isActive('underline') ? 'is-active' : ''}`} title="Underline">
                <FormatUnderlineIcon />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`tetrone-bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`} title="Strike">
                <FormatStrikeIcon />
            </button>

            <div className="tetrone-bubble-divider"></div>

            <button type="button" onClick={() => editor.chain().focus().toggleSpoiler().run()} className={`tetrone-bubble-btn ${editor.isActive('spoiler') ? 'is-active' : ''}`} title="Spoiler">
                <EyeOffIcon />
            </button>

            {typeof editor.commands.setLink === 'function' && (
                <button type="button" onClick={setLink} className={`tetrone-bubble-btn ${editor.isActive('link') ? 'is-active' : ''}`} title="Link">
                    <FormatLinkIcon />
                </button>
            )}

            {supportsStyles && (
                <>
                    <div className="tetrone-bubble-divider"></div>

                    {/* Колір тексту */}
                    <input
                        type="color"
                        onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        className="tetrone-bubble-color-picker"
                        title={t('editor.text_color', 'Колір тексту')}
                    />

                    {/* Колір виділення (Highlight) */}
                    <input
                        type="color"
                        onInput={event => editor.chain().focus().setHighlight({ color: event.target.value }).run()}
                        value={editor.getAttributes('highlight').color || '#ffeb3b'}
                        className="tetrone-bubble-color-picker"
                        title={t('editor.highlight_color', 'Колір виділення')}
                        style={{ borderRadius: '4px' }}
                    />

                    {/* Вибір шрифту */}
                    <select
                        onChange={event => editor.chain().focus().setFontFamily(event.target.value).run()}
                        value={editor.getAttributes('textStyle').fontFamily || ''}
                        className="tetrone-bubble-select"
                        title={t('editor.font_family', 'Шрифт')}
                    >
                        <option value="">{t('editor.font_default', 'Шрифт')}</option>
                        {ALLOWED_FONTS.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                        ))}
                    </select>

                    {/* Вибір розміру */}
                    <select
                        onChange={event => editor.chain().focus().setFontSize(event.target.value).run()}
                        value={editor.getAttributes('textStyle').fontSize || ''}
                        className="tetrone-bubble-select"
                        title={t('editor.font_size', 'Розмір')}
                    >
                        <option value="">A</option>
                        {ALLOWED_FONT_SIZES.map(size => (
                            <option key={size} value={size}>{size.replace('px', '')}</option>
                        ))}
                    </select>
                </>
            )}
            {/* Додано пікер кольору для Витягу */}
            {editor.isActive('pullquote') && (
                <>
                    <div className="tetrone-bubble-divider"></div>
                    <input
                        type="color"
                        onInput={event => editor.chain().focus().setPullquoteColor(event.target.value).run()}
                        value={editor.getAttributes('pullquote').color || '#e53935'}
                        className="tetrone-bubble-color-picker"
                        title={t('editor.pullquote_color')}
                    />
                </>
            )}

            {editor.isActive('table') && (
                <>
                    <div className="tetrone-bubble-divider"></div>
                    <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="tetrone-bubble-btn" title="Add Row After">
                        <TableAddRowIcon />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="tetrone-bubble-btn" title="Add Column After">
                        <TableAddColIcon />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className="tetrone-bubble-btn" title="Merge/Unmerge Cells">
                        <TableMergeIcon />
                    </button>
                    <div className="tetrone-bubble-divider"></div>
                    <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="tetrone-bubble-btn danger" title="Delete Row">
                        <TableDelRowIcon />
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="tetrone-bubble-btn danger" title="Delete Column">
                        <TableDelColIcon />
                    </button>
                </>
            )}

        </BubbleMenu>
    );
}