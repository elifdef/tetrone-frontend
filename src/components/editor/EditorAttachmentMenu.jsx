import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PaperclipIcon, PollIcon, ListBulletIcon, ListOrderedIcon, ListTaskIcon, TableIcon,
    FormatBoldIcon, FormatItalicIcon, FormatUnderlineIcon, FormatStrikeIcon, EyeOffIcon,
    SubscriptIcon, SuperscriptIcon, HighlightIcon, FormatTextIcon, HeadingIcon, TextIcon,
    QuoteIcon, CodeIcon, DividerIcon, TableAddRowIcon, TableAddColIcon, TableDelRowIcon,
    TableDelColIcon, TableMergeIcon, PullquoteIcon, FormatLinkIcon
} from '../ui/Icons';

export default function EditorAttachmentMenu({ editor, onAddPoll }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const [openDirection, setOpenDirection] = useState('up'); // 'up' або 'down'
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
                setActiveSubmenu(null);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!editor) return null;

    const canAddLists = typeof editor.commands.toggleBulletList === 'function';
    const canAddTables = typeof editor.commands.insertTable === 'function';
    const canFormat = typeof editor.commands.toggleHeading === 'function';
    const canStyle = typeof editor.commands.toggleBold === 'function';

    const executeAndClose = (command) => {
        command();
        setIsOpen(false);
        setActiveSubmenu(null);
    };

    const toggleMenu = (e) => {
        if (!isOpen) {
            const rect = e.currentTarget.getBoundingClientRect();
            // Якщо кнопка знаходиться у нижній половині екрана, відкриваємо вгору
            if (rect.top > window.innerHeight / 2) {
                setOpenDirection('up');
            } else {
                setOpenDirection('down');
            }
        }
        setIsOpen(!isOpen);
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt(t('editor.enter_link'), previousUrl);
        if (url === null) return;
        if (url === '') {
            executeAndClose(() => editor.chain().focus().extendMarkRange('link').unsetLink().run());
            return;
        }
        executeAndClose(() => editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run());
    };

    return (
        <div className="tetrone-editor-attachment-wrapper" ref={menuRef}>
            <button
                type="button"
                className={`tetrone-editor-side-btn ${isOpen ? 'active' : ''}`}
                onClick={toggleMenu}
                title={t('action.attach')}
            >
                <PaperclipIcon />
            </button>

            {isOpen && (
                <div className={`tetrone-editor-attachment-dropdown open-${openDirection}`} onMouseLeave={() => setActiveSubmenu(null)}>
                    {onAddPoll && (
                        <button type="button" className="tetrone-editor-dropdown-item" onMouseEnter={() => setActiveSubmenu(null)} onClick={() => executeAndClose(onAddPoll)}>
                            <PollIcon width={16} height={16} /> {t('poll.add_poll')}
                        </button>
                    )}

                    {canStyle && (
                        <div className="tetrone-editor-dropdown-item has-submenu" onMouseEnter={() => setActiveSubmenu('style')}>
                            <FormatBoldIcon width={16} height={16} /> {t('editor.text_styles')}
                            <span className="tetrone-submenu-arrow">▶</span>
                            {activeSubmenu === 'style' && (
                                <div className="tetrone-editor-submenu">
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('bold') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleBold().run())}>
                                        <FormatBoldIcon width={16} height={16} /> {t('editor.bold')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('italic') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleItalic().run())}>
                                        <FormatItalicIcon width={16} height={16} /> {t('editor.italic')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('underline') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleUnderline().run())}>
                                        <FormatUnderlineIcon width={16} height={16} /> {t('editor.underline')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('strike') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleStrike().run())}>
                                        <FormatStrikeIcon width={16} height={16} /> {t('editor.strike')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('spoiler') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleSpoiler().run())}>
                                        <EyeOffIcon width={16} height={16} /> {t('editor.spoiler')}
                                    </button>
                                    {typeof editor.commands.setLink === 'function' && (
                                        <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('link') ? 'tetrone-active-item' : ''}`} onClick={setLink}>
                                            <FormatLinkIcon width={16} height={16} /> {t('editor.link')}
                                        </button>
                                    )}
                                    {typeof editor.commands.toggleSubscript === 'function' && (
                                        <>
                                            <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('subscript') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleSubscript().run())}>
                                                <SubscriptIcon width={16} height={16} /> {t('editor.subscript')}
                                            </button>
                                            <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('superscript') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleSuperscript().run())}>
                                                <SuperscriptIcon width={16} height={16} /> {t('editor.superscript')}
                                            </button>
                                            <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('highlight') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleHighlight().run())}>
                                                <HighlightIcon width={16} height={16} /> {t('editor.highlight')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {canFormat && (
                        <div className="tetrone-editor-dropdown-item has-submenu" onMouseEnter={() => setActiveSubmenu('format')}>
                            <FormatTextIcon width={16} height={16} /> {t('editor.format_text')}
                            <span className="tetrone-submenu-arrow">▶</span>
                            {activeSubmenu === 'format' && (
                                <div className="tetrone-editor-submenu">
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('heading', { level: 1 }) ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
                                        <HeadingIcon width={16} height={16} /> {t('editor.heading_1')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('heading', { level: 2 }) ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
                                        <HeadingIcon width={16} height={16} /> {t('editor.heading_2')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('heading', { level: 3 }) ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
                                        <HeadingIcon width={16} height={16} /> {t('editor.heading_3')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('paragraph') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().setParagraph().run())}>
                                        <TextIcon width={16} height={16} /> {t('editor.paragraph')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('blockquote') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleBlockquote().run())}>
                                        <QuoteIcon width={16} height={16} /> {t('editor.blockquote')}
                                    </button>
                                    {typeof editor.commands.togglePullquote === 'function' && (
                                        <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('pullquote') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().togglePullquote().run())}>
                                            <PullquoteIcon width={16} height={16} /> {t('editor.pullquote')}
                                        </button>
                                    )}
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('codeBlock') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleCodeBlock().run())}>
                                        <CodeIcon width={16} height={16} /> {t('editor.code')}
                                    </button>
                                    <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().setHorizontalRule().run())}>
                                        <DividerIcon width={16} height={16} /> {t('editor.divider')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {canAddLists && (
                        <div className="tetrone-editor-dropdown-item has-submenu" onMouseEnter={() => setActiveSubmenu('lists')}>
                            <ListBulletIcon width={16} height={16} /> {t('editor.lists')}
                            <span className="tetrone-submenu-arrow">▶</span>
                            {activeSubmenu === 'lists' && (
                                <div className="tetrone-editor-submenu">
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('orderedList') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleOrderedList().run())}>
                                        <ListOrderedIcon width={16} height={16} /> {t('editor.ordered_list')}
                                    </button>
                                    <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('bulletList') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleBulletList().run())}>
                                        <ListBulletIcon width={16} height={16} /> {t('editor.bullet_list')}
                                    </button>
                                    {typeof editor.commands.toggleTaskList === 'function' && (
                                        <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('taskList') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().toggleTaskList().run())}>
                                            <ListTaskIcon width={16} height={16} /> {t('editor.task_list')}
                                        </button>
                                    )}
                                    {typeof editor.commands.setDetails === 'function' && (
                                        <button type="button" className={`tetrone-editor-dropdown-item ${editor.isActive('details') ? 'tetrone-active-item' : ''}`} onClick={() => executeAndClose(() => editor.chain().focus().setDetails(t('editor.details_title', 'Заголовок...'), t('editor.details_text', 'Текст...')).run())}>
                                            <DividerIcon width={16} height={16} /> {t('editor.collapsible_block')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {canAddTables && (
                        <div className="tetrone-editor-dropdown-item has-submenu" onMouseEnter={() => setActiveSubmenu('table')}>
                            <TableIcon width={16} height={16} /> {t('editor.table')}
                            <span className="tetrone-submenu-arrow">▶</span>
                            {activeSubmenu === 'table' && (
                                <div className="tetrone-editor-submenu">
                                    {!editor.isActive('table') ? (
                                        <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}>
                                            <TableIcon width={16} height={16} /> {t('editor.insert_table')}
                                        </button>
                                    ) : (
                                        <>
                                            <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().addRowAfter().run())}>
                                                <TableAddRowIcon width={16} height={16} /> {t('editor.add_row')}
                                            </button>
                                            <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().addColumnAfter().run())}>
                                                <TableAddColIcon width={16} height={16} /> {t('editor.add_col')}
                                            </button>
                                            <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().mergeCells().run())}>
                                                <TableMergeIcon width={16} height={16} /> {t('editor.merge_cells')}
                                            </button>
                                            <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().splitCell().run())}>
                                                <TableMergeIcon width={16} height={16} /> {t('editor.split_cell')}
                                            </button>
                                            <div style={{ height: '1px', background: 'var(--theme-border)', margin: '4px 0' }}></div>
                                            <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().toggleHeaderRow().run())}>
                                                <HeadingIcon width={16} height={16} /> {t('editor.toggle_header_row')}
                                            </button>
                                            <button type="button" className="tetrone-editor-dropdown-item" onClick={() => executeAndClose(() => editor.chain().focus().toggleHeaderColumn().run())}>
                                                <HeadingIcon width={16} height={16} /> {t('editor.toggle_header_col')}
                                            </button>
                                            <div style={{ height: '1px', background: 'var(--theme-border)', margin: '4px 0' }}></div>
                                            <button type="button" className="tetrone-editor-dropdown-item danger" style={{ color: 'var(--theme-error)' }} onClick={() => executeAndClose(() => editor.chain().focus().deleteRow().run())}>
                                                <TableDelRowIcon width={16} height={16} /> {t('editor.delete_row')}
                                            </button>
                                            <button type="button" className="tetrone-editor-dropdown-item danger" style={{ color: 'var(--theme-error)' }} onClick={() => executeAndClose(() => editor.chain().focus().deleteColumn().run())}>
                                                <TableDelColIcon width={16} height={16} /> {t('editor.delete_col')}
                                            </button>
                                            <button type="button" className="tetrone-editor-dropdown-item danger" style={{ color: 'var(--theme-error)' }} onClick={() => executeAndClose(() => editor.chain().focus().deleteTable().run())}>
                                                <TableIcon width={16} height={16} /> {t('editor.delete_table')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}