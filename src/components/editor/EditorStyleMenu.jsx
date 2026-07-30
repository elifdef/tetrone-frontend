import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FormatBoldIcon, FormatItalicIcon, FormatUnderlineIcon,
    FormatStrikeIcon, EyeOffIcon, SubscriptIcon, SuperscriptIcon, HighlightIcon
} from '../ui/Icons';

export default function EditorStyleMenu({ editor }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!editor) return null;

    const executeAndClose = (command) => {
        command();
        setIsOpen(false);
    };

    return (
        <div className="tetrone-editor-attachment-wrapper" ref={menuRef}>
            <button
                type="button"
                className={`tetrone-editor-side-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={t('editor.text_styles', 'Стилі')}
            >
                <FormatBoldIcon />
            </button>

            {isOpen && (
                <div className="tetrone-editor-attachment-dropdown">
                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('bold') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleBold().run())}>
                        <FormatBoldIcon width={16} height={16} /> {t('editor.bold', 'Жирний')}
                        <span className="tetrone-shortcut-hint">Ctrl+B</span>
                    </button>
                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('italic') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleItalic().run())}>
                        <FormatItalicIcon width={16} height={16} /> {t('editor.italic', 'Курсив')}
                        <span className="tetrone-shortcut-hint">Ctrl+I</span>
                    </button>
                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('underline') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleUnderline().run())}>
                        <FormatUnderlineIcon width={16} height={16} /> {t('editor.underline', 'Підкреслений')}
                        <span className="tetrone-shortcut-hint">Ctrl+U</span>
                    </button>
                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('strike') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleStrike().run())}>
                        <FormatStrikeIcon width={16} height={16} /> {t('editor.strike', 'Закреслений')}
                        <span className="tetrone-shortcut-hint">Ctrl+Shift+X</span>
                    </button>
                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('spoiler') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleSpoiler().run())}>
                        <EyeOffIcon width={16} height={16} /> {t('editor.spoiler', 'Спойлер')}
                        <span className="tetrone-shortcut-hint">Ctrl+Shift+P</span>
                    </button>

                    {typeof editor.commands.toggleSubscript === 'function' && (
                        <>
                            <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('subscript') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleSubscript().run())}>
                                <SubscriptIcon width={16} height={16} /> {t('editor.subscript', 'Підрядковий')}
                            </button>
                            <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('superscript') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleSuperscript().run())}>
                                <SuperscriptIcon width={16} height={16} /> {t('editor.superscript', 'Надрядковий')}
                            </button>
                            <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('highlight') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleHighlight().run())}>
                                <HighlightIcon width={16} height={16} /> {t('editor.highlight', 'Виділений')}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}