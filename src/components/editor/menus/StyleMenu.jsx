import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus'; // <--- ФІКС ТУТ
import { useTranslation } from 'react-i18next';
import {
    FormatBoldIcon, FormatItalicIcon, FormatUnderlineIcon,
    FormatStrikeIcon, FormatLinkIcon, EyeOffIcon, QuoteIcon
} from '../../ui/Icons';

export default function StyleMenu({ editor }) {
    const { t } = useTranslation();
    if (!editor) return null;

    const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px'];
    const ALLOWED_FONTS = ['Tahoma', 'Arial', 'Times New Roman', 'Verdana', 'Courier New'];

    const setLink = () => {
        const url = window.prompt(t('editor.enter_link'), editor.getAttributes('link').href || '');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const supportsStyles = typeof editor.commands.setColor === 'function';

    const getBtnClass = (isActive) => `bg-transparent border-none p-[4px] cursor-pointer flex items-center justify-center transition-none outline-none rounded-[2px] h-[22px] w-[22px] ${isActive ? 'text-theme-link bg-bg-page border border-border' : 'text-text-main hover:bg-bg-page border border-transparent'}`;

    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 0, placement: 'top' }} className="flex items-center bg-bg-box border border-border shadow-sm p-[2px] gap-[2px] z-[1000] rounded-[2px]">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={getBtnClass(editor.isActive('bold'))} title={t('editor.bold')}>
                <FormatBoldIcon width={14} height={14} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={getBtnClass(editor.isActive('italic'))} title={t('editor.italic')}>
                <FormatItalicIcon width={14} height={14} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={getBtnClass(editor.isActive('underline'))} title={t('editor.underline')}>
                <FormatUnderlineIcon width={14} height={14} />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={getBtnClass(editor.isActive('strike'))} title={t('editor.strike')}>
                <FormatStrikeIcon width={14} height={14} />
            </button>

            <div className="w-[1px] h-[16px] bg-border mx-[2px]"></div>

            <button type="button" onClick={() => editor.chain().focus().toggleSpoiler().run()} className={getBtnClass(editor.isActive('spoiler'))} title={t('editor.spoiler')}>
                <EyeOffIcon width={14} height={14} />
            </button>

            {typeof editor.commands.setLink === 'function' && (
                <button type="button" onClick={setLink} className={getBtnClass(editor.isActive('link'))} title={t('editor.link')}>
                    <FormatLinkIcon width={14} height={14} />
                </button>
            )}

            {typeof editor.commands.toggleBlockquote === 'function' && (
                <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={getBtnClass(editor.isActive('blockquote'))} title={t('editor.blockquote')}>
                    <QuoteIcon width={14} height={14} />
                </button>
            )}

            {supportsStyles && (
                <>
                    <div className="w-[1px] h-[16px] bg-border mx-[2px]"></div>

                    <input
                        type="color"
                        onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        className="w-[22px] h-[22px] p-0 border-none cursor-pointer bg-transparent outline-none"
                        title={t('editor.text_color')}
                    />

                    <input
                        type="color"
                        onInput={event => editor.chain().focus().setHighlight({ color: event.target.value }).run()}
                        value={editor.getAttributes('highlight').color || '#ffff00'}
                        className="w-[22px] h-[22px] p-0 border-none cursor-pointer bg-transparent outline-none"
                        title={t('editor.highlight_color')}
                    />

                    <div className="w-[1px] h-[16px] bg-border mx-[2px]"></div>

                    <select
                        onChange={event => editor.chain().focus().setFontFamily(event.target.value).run()}
                        value={editor.getAttributes('textStyle').fontFamily || ''}
                        className="bg-transparent border-none text-text-main font-tahoma text-[11px] cursor-pointer outline-none hover:bg-bg-page h-[22px]"
                        title={t('editor.font_family')}
                    >
                        <option value="">{t('editor.font_default')}</option>
                        {ALLOWED_FONTS.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                        ))}
                    </select>

                    <select
                        onChange={event => editor.chain().focus().setFontSize(event.target.value).run()}
                        value={editor.getAttributes('textStyle').fontSize || ''}
                        className="bg-transparent border-none text-text-main font-tahoma text-[11px] cursor-pointer outline-none hover:bg-bg-page h-[22px]"
                        title={t('editor.font_size')}
                    >
                        <option value="">A</option>
                        {ALLOWED_FONT_SIZES.map(size => (
                            <option key={size} value={size}>{size.replace('px', '')}</option>
                        ))}
                    </select>
                </>
            )}
        </BubbleMenu>
    );
}