import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useOnClickOutside from '../hooks/useOnClickOutside';
import { FormatTextIcon, HeadingIcon, TextIcon, QuoteIcon, CodeIcon, DividerIcon } from '../../ui/Icons';

export default function FormatMenu({ editor }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useOnClickOutside(ref, () => setIsOpen(false));

    if (!editor || typeof editor.commands.toggleHeading !== 'function') return null;

    const execute = (command) => { command(); setIsOpen(false); };
    const itemClass = "w-full text-left px-[8px] py-[6px] flex items-center gap-[6px] text-text-main hover:bg-bg-page hover:text-theme-link hover:underline cursor-pointer border-none bg-transparent outline-none text-[11px] font-normal transition-none";

    return (
        <div className="relative flex" ref={ref}>
            <button
                type="button"
                className={`bg-transparent border-none cursor-pointer p-[4px] flex items-center justify-center transition-none outline-none rounded-[2px] ${isOpen ? 'text-theme-link bg-bg-page' : 'text-text-muted hover:text-theme-link hover:bg-bg-page'}`}
                onClick={() => setIsOpen(!isOpen)}
                title={t('editor.format_text')}
            >
                <FormatTextIcon width={16} height={16} />
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-[2px] left-0 bg-bg-box border border-border shadow-sm flex flex-col min-w-[160px] py-[2px] z-[100] rounded-[2px]">
                    <button type="button" className={itemClass} onClick={() => execute(() => editor.chain().focus().setParagraph().run())}>
                        <TextIcon width={14} height={14} /> {t('editor.paragraph')}
                    </button>
                    <div className="h-[1px] bg-border my-[2px]"></div>
                    <button type="button" className={itemClass} onClick={() => execute(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
                        <HeadingIcon width={14} height={14} /> {t('editor.heading_1')}
                    </button>
                    <button type="button" className={itemClass} onClick={() => execute(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
                        <HeadingIcon width={14} height={14} /> {t('editor.heading_2')}
                    </button>
                    <button type="button" className={itemClass} onClick={() => execute(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
                        <HeadingIcon width={14} height={14} /> {t('editor.heading_3')}
                    </button>
                    <div className="h-[1px] bg-border my-[2px]"></div>
                    <button type="button" className={itemClass} onClick={() => execute(() => editor.chain().focus().toggleBlockquote().run())}>
                        <QuoteIcon width={14} height={14} /> {t('editor.blockquote')}
                    </button>
                    <button type="button" className={itemClass} onClick={() => execute(() => editor.chain().focus().toggleCodeBlock().run())}>
                        <CodeIcon width={14} height={14} /> {t('editor.code')}
                    </button>
                    <button type="button" className={itemClass} onClick={() => execute(() => editor.chain().focus().setHorizontalRule().run())}>
                        <DividerIcon width={14} height={14} /> {t('editor.divider')}
                    </button>
                </div>
            )}
        </div>
    );
}