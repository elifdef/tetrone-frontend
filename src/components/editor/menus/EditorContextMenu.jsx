import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useOnClickOutside from '../hooks/useOnClickOutside';
import {
    PollIcon, ListBulletIcon, ListOrderedIcon, ListTaskIcon, TableIcon,
    FormatTextIcon, HeadingIcon, TextIcon, QuoteIcon, CodeIcon, DividerIcon,
    TableAddRowIcon, TableAddColIcon, TableDelRowIcon, TableDelColIcon, TableMergeIcon
} from '../../ui/Icons';

export default function EditorContextMenu({ editor, onAddPoll, x, y, onClose }) {
    const { t } = useTranslation();
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const menuRef = useRef(null);

    useOnClickOutside(menuRef, onClose);

    if (!editor) return null;

    const executeAndClose = (command) => {
        command();
        onClose();
    };

    const canFormat = typeof editor.commands.toggleHeading === 'function';
    const canAddLists = typeof editor.commands.toggleBulletList === 'function';
    const canAddTables = typeof editor.commands.insertTable === 'function';

    const getItemClass = (isActive = false, isDanger = false) => {
        return `w-full text-left px-[10px] py-[6px] flex items-center gap-[8px] text-[11px] outline-none cursor-pointer border-none bg-transparent whitespace-nowrap transition-none ${isActive ? 'bg-bg-page text-theme-link' : 'text-text-main hover:bg-bg-page hover:text-theme-link'} ${isDanger ? '!text-theme-error hover:!text-theme-error' : ''}`;
    };

    return (
        <div
            ref={menuRef}
            className="fixed bg-bg-box border border-border shadow-sm flex flex-col min-w-[180px] py-[2px] z-[9999] rounded-[2px]"
            style={{ top: y, left: x }}
            onMouseLeave={() => setActiveSubmenu(null)}
        >
            {onAddPoll && (
                <button type="button" className={getItemClass()} onMouseEnter={() => setActiveSubmenu(null)} onClick={() => executeAndClose(onAddPoll)}>
                    <PollIcon width={14} height={14} /> {t('poll.add_poll')}
                </button>
            )}

            {canFormat && (
                <div className={`relative flex items-center justify-between ${getItemClass()}`} onMouseEnter={() => setActiveSubmenu('format')}>
                    <div className="flex items-center gap-[8px]"><FormatTextIcon width={14} height={14} /> {t('editor.format_text')}</div>
                    <span className="text-[8px] text-text-muted">▶</span>

                    {activeSubmenu === 'format' && (
                        <div className="absolute left-full top-0 ml-[2px] bg-bg-box border border-border shadow-sm flex flex-col min-w-[160px] py-[2px] z-[10001] rounded-[2px]">
                            <button type="button" className={getItemClass(editor.isActive('heading', { level: 1 }))} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
                                <HeadingIcon width={14} height={14} /> {t('editor.heading_1')}
                            </button>
                            <button type="button" className={getItemClass(editor.isActive('heading', { level: 2 }))} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
                                <HeadingIcon width={14} height={14} /> {t('editor.heading_2')}
                            </button>
                            <button type="button" className={getItemClass(editor.isActive('heading', { level: 3 }))} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
                                <HeadingIcon width={14} height={14} /> {t('editor.heading_3')}
                            </button>
                            <div className="h-[1px] bg-border my-[2px]"></div>
                            <button type="button" className={getItemClass(editor.isActive('paragraph'))} onClick={() => executeAndClose(() => editor.chain().focus().setParagraph().run())}>
                                <TextIcon width={14} height={14} /> {t('editor.paragraph')}
                            </button>
                            <button type="button" className={getItemClass(editor.isActive('blockquote'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleBlockquote().run())}>
                                <QuoteIcon width={14} height={14} /> {t('editor.blockquote')}
                            </button>
                            <button type="button" className={getItemClass(editor.isActive('codeBlock'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleCodeBlock().run())}>
                                <CodeIcon width={14} height={14} /> {t('editor.code')}
                            </button>
                            <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().setHorizontalRule().run())}>
                                <DividerIcon width={14} height={14} /> {t('editor.divider')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {canAddLists && (
                <div className={`relative flex items-center justify-between ${getItemClass()}`} onMouseEnter={() => setActiveSubmenu('lists')}>
                    <div className="flex items-center gap-[8px]"><ListBulletIcon width={14} height={14} /> {t('editor.lists')}</div>
                    <span className="text-[8px] text-text-muted">▶</span>

                    {activeSubmenu === 'lists' && (
                        <div className="absolute left-full top-0 ml-[2px] bg-bg-box border border-border shadow-sm flex flex-col min-w-[160px] py-[2px] z-[10001] rounded-[2px]">
                            <button type="button" className={getItemClass(editor.isActive('orderedList'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleOrderedList().run())}>
                                <ListOrderedIcon width={14} height={14} /> {t('editor.ordered_list')}
                            </button>
                            <button type="button" className={getItemClass(editor.isActive('bulletList'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleBulletList().run())}>
                                <ListBulletIcon width={14} height={14} /> {t('editor.bullet_list')}
                            </button>
                            {typeof editor.commands.toggleTaskList === 'function' && (
                                <button type="button" className={getItemClass(editor.isActive('taskList'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleTaskList().run())}>
                                    <ListTaskIcon width={14} height={14} /> {t('editor.task_list')}
                                </button>
                            )}
                            {typeof editor.commands.setDetails === 'function' && (
                                <button type="button" className={getItemClass(editor.isActive('details'))} onClick={() => executeAndClose(() => editor.chain().focus().setDetails(t('editor.details_title'), t('editor.details_text')).run())}>
                                    <DividerIcon width={14} height={14} /> {t('editor.collapsible_block')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {canAddTables && (
                <div className={`relative flex items-center justify-between ${getItemClass()}`} onMouseEnter={() => setActiveSubmenu('table')}>
                    <div className="flex items-center gap-[8px]"><TableIcon width={14} height={14} /> {t('editor.table')}</div>
                    <span className="text-[8px] text-text-muted">▶</span>

                    {activeSubmenu === 'table' && (
                        <div className="absolute left-full top-0 ml-[2px] bg-bg-box border border-border shadow-sm flex flex-col min-w-[160px] py-[2px] z-[10001] rounded-[2px]">
                            {!editor.isActive('table') ? (
                                <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}>
                                    <TableIcon width={14} height={14} /> {t('editor.insert_table')}
                                </button>
                            ) : (
                                <>
                                    <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().addRowAfter().run())}>
                                        <TableAddRowIcon width={14} height={14} /> {t('editor.add_row')}
                                    </button>
                                    <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().addColumnAfter().run())}>
                                        <TableAddColIcon width={14} height={14} /> {t('editor.add_col')}
                                    </button>
                                    <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().mergeCells().run())}>
                                        <TableMergeIcon width={14} height={14} /> {t('editor.merge_cells')}
                                    </button>
                                    <div className="h-[1px] bg-border my-[2px]"></div>
                                    <button type="button" className={getItemClass(false, true)} onClick={() => executeAndClose(() => editor.chain().focus().deleteRow().run())}>
                                        <TableDelRowIcon width={14} height={14} /> {t('editor.delete_row')}
                                    </button>
                                    <button type="button" className={getItemClass(false, true)} onClick={() => executeAndClose(() => editor.chain().focus().deleteColumn().run())}>
                                        <TableDelColIcon width={14} height={14} /> {t('editor.delete_col')}
                                    </button>
                                    <button type="button" className={getItemClass(false, true)} onClick={() => executeAndClose(() => editor.chain().focus().deleteTable().run())}>
                                        <TableIcon width={14} height={14} /> {t('editor.delete_table')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}