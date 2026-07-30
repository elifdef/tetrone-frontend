import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FormatTextIcon, HeadingIcon, TextIcon, QuoteIcon, CodeIcon, DividerIcon } from '../ui/Icons';

export default function EditorFormatMenu({ editor }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
                setShowHeadingMenu(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!editor) return null;

    // Якщо пресет не підтримує заголовки, не показуємо меню
    if (typeof editor.commands.toggleHeading !== 'function') return null;

    const executeAndClose = (command) => {
        command();
        setIsOpen(false);
        setShowHeadingMenu(false);
    };

    return (
        <div className="tetrone-editor-attachment-wrapper" ref={menuRef}>
            <button
                type="button"
                className={`tetrone-editor-side-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={t('editor.format_text', 'Форматування')}
            >
                <FormatTextIcon />
            </button>

            {isOpen && (
                <div className="tetrone-editor-attachment-dropdown">
                    <div
                        className="tetrone-editor-dropdown-item has-submenu"
                        onMouseEnter={() => setShowHeadingMenu(true)}
                        onMouseLeave={() => setShowHeadingMenu(false)}
                    >
                        <HeadingIcon /> Заголовок
                        <span className="tetrone-submenu-arrow">▶</span>

                        {showHeadingMenu && (
                            <div className="tetrone-editor-submenu">
                                <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
                                    Заголовок 1
                                </button>
                                <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
                                    Заголовок 2
                                </button>
                                <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
                                    Заголовок 3
                                </button>
                            </div>
                        )}
                    </div>

                    <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().setParagraph().run())}>
                        <TextIcon /> Текст
                    </button>

                    <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().toggleBlockquote().run())}>
                        <QuoteIcon /> Цитата
                    </button>

                    <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().toggleCodeBlock().run())}>
                        <CodeIcon /> Код
                    </button>

                    <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().setHorizontalRule().run())}>
                        <DividerIcon /> Роздільник
                    </button>
                </div>
            )}
        </div>
    );
}