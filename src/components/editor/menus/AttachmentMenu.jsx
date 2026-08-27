import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PaperclipIcon, PollIcon, ListBulletIcon, ListOrderedIcon, ListTaskIcon, TableIcon,
    FormatBoldIcon, FormatItalicIcon, FormatUnderlineIcon, FormatStrikeIcon, EyeOffIcon,
    SubscriptIcon, SuperscriptIcon, HighlightIcon, FormatTextIcon, HeadingIcon, TextIcon,
    QuoteIcon, CodeIcon, DividerIcon, TableAddRowIcon, TableAddColIcon, TableDelRowIcon,
    TableDelColIcon, TableMergeIcon, PullquoteIcon, FormatLinkIcon
} from '../../ui/Icons';
import useOnClickOutside from '../hooks/useOnClickOutside';

export default function AttachmentMenu({ editor, onAddPoll }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const menuRef = useRef(null);

    useOnClickOutside(menuRef, () => {
        setIsOpen(false);
        setActiveSubmenu(null);
    });

    if (!editor) return null;

    const executeAndClose = (command) => {
        command();
        setIsOpen(false);
        setActiveSubmenu(null);
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt(t('editor.enter_link'), previousUrl || '');
        if (url === null) return;
        if (url === '') {
            executeAndClose(() => editor.chain().focus().extendMarkRange('link').unsetLink().run());
            return;
        }
        executeAndClose(() => editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run());
    };

    // Універсальний генератор класів для пунктів меню
    const getItemClass = (isActive = false, isDanger = false) => {
        return `w-full text-left px-[12px] py-[8px] flex items-center gap-[10px] outline-none cursor-pointer border-none bg-transparent whitespace-nowrap transition-none text-[12px] ${isActive ? 'bg-[rgba(255,255,255,0.05)] text-theme-link' : 'text-text-main hover:bg-[rgba(255,255,255,0.05)] hover:text-theme-link'} ${isDanger ? '!text-theme-error hover:!text-theme-error hover:bg-[rgba(255,51,71,0.1)]' : ''}`;
    };

    const canStyle = typeof editor.commands.toggleBold === 'function';
    const canFormat = typeof editor.commands.toggleHeading === 'function';
    const canAddLists = typeof editor.commands.toggleBulletList === 'function';
    const canAddTables = typeof editor.commands.insertTable === 'function';

    return (
        <div className="relative flex" ref={menuRef}>
            <button
                type="button"
                className={`bg-transparent border-none cursor-pointer p-[8px] flex items-center justify-center outline-none rounded-[2px] transition-colors ${isOpen ? 'text-theme-link bg-[rgba(255,255,255,0.05)]' : 'text-text-muted hover:text-theme-link hover:bg-[rgba(255,255,255,0.05)]'}`}
                onClick={() => setIsOpen(!isOpen)}
                title={t('action.attach')}
            >
                <PaperclipIcon width={20} height={20} />
            </button>

            {isOpen && (
                <div
                    className="absolute bottom-full mb-[5px] left-0 bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col min-w-[200px] py-[4px] z-[100] rounded-[4px]"
                    onMouseLeave={() => setActiveSubmenu(null)}
                >
                    {onAddPoll && (
                        <button type="button" className={getItemClass()} onMouseEnter={() => setActiveSubmenu(null)} onClick={() => executeAndClose(onAddPoll)}>
                            <PollIcon width={16} height={16} /> {t('poll.add_poll')}
                        </button>
                    )}

                    {canStyle && (
                        <div className={`relative flex items-center justify-between ${getItemClass()}`} onMouseEnter={() => setActiveSubmenu('style')}>
                            <div className="flex items-center gap-[10px]"><FormatBoldIcon width={16} height={16} /> {t('editor.text_styles')}</div>
                            <span className="text-[10px] text-text-muted">▶</span>

                            {activeSubmenu === 'style' && (
                                <div className="absolute left-full bottom-[-4px] ml-[2px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col min-w-[180px] py-[4px] z-[101] rounded-[4px]">
                                    <button type="button" className={getItemClass(editor.isActive('bold'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleBold().run())}>
                                        <FormatBoldIcon width={16} height={16} /> {t('editor.bold')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('italic'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleItalic().run())}>
                                        <FormatItalicIcon width={16} height={16} /> {t('editor.italic')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('underline'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleUnderline().run())}>
                                        <FormatUnderlineIcon width={16} height={16} /> {t('editor.underline')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('strike'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleStrike().run())}>
                                        <FormatStrikeIcon width={16} height={16} /> {t('editor.strike')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('spoiler'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleSpoiler().run())}>
                                        <EyeOffIcon width={16} height={16} /> {t('editor.spoiler')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('link'))} onClick={setLink}>
                                        <FormatLinkIcon width={16} height={16} /> editor.link
                                    </button>
                                    {typeof editor.commands.toggleSubscript === 'function' && (
                                        <>
                                            <button type="button" className={getItemClass(editor.isActive('subscript'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleSubscript().run())}>
                                                <SubscriptIcon width={16} height={16} /> {t('editor.subscript')}
                                            </button>
                                            <button type="button" className={getItemClass(editor.isActive('superscript'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleSuperscript().run())}>
                                                <SuperscriptIcon width={16} height={16} /> {t('editor.superscript')}
                                            </button>
                                            <button type="button" className={getItemClass(editor.isActive('highlight'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleHighlight().run())}>
                                                <HighlightIcon width={16} height={16} /> {t('editor.highlight')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {canFormat && (
                        <div className={`relative flex items-center justify-between ${getItemClass()}`} onMouseEnter={() => setActiveSubmenu('format')}>
                            <div className="flex items-center gap-[10px]"><FormatTextIcon width={16} height={16} /> {t('editor.format_text')}</div>
                            <span className="text-[10px] text-text-muted">▶</span>

                            {activeSubmenu === 'format' && (
                                <div className="absolute left-full bottom-[-4px] ml-[2px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col min-w-[180px] py-[4px] z-[101] rounded-[4px]">
                                    <button type="button" className={getItemClass(editor.isActive('heading', { level: 1 }))} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
                                        <HeadingIcon width={16} height={16} /> {t('editor.heading_1')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('heading', { level: 2 }))} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
                                        <HeadingIcon width={16} height={16} /> {t('editor.heading_2')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('heading', { level: 3 }))} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
                                        <HeadingIcon width={16} height={16} /> {t('editor.heading_3')}
                                    </button>

                                    <div className="h-[1px] bg-border my-[2px]"></div>

                                    <button type="button" className={getItemClass(editor.isActive({ textAlign: 'left' }))} onClick={() => executeAndClose(() => editor.chain().focus().setTextAlign('left').run())}>
                                        {t('editor.align_left', 'По лівому краю')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive({ textAlign: 'center' }))} onClick={() => executeAndClose(() => editor.chain().focus().setTextAlign('center').run())}>
                                        {t('editor.align_center', 'По центру')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive({ textAlign: 'right' }))} onClick={() => executeAndClose(() => editor.chain().focus().setTextAlign('right').run())}>
                                        {t('editor.align_right', 'По правому краю')}
                                    </button>

                                    <button type="button" className={getItemClass(editor.isActive('paragraph'))} onClick={() => executeAndClose(() => editor.chain().focus().setParagraph().run())}>
                                        <TextIcon width={16} height={16} /> {t('editor.paragraph')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('blockquote'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleBlockquote().run())}>
                                        <QuoteIcon width={16} height={16} /> {t('editor.blockquote')}
                                    </button>
                                    {typeof editor.commands.togglePullquote === 'function' && (
                                        <button type="button" className={getItemClass(editor.isActive('pullquote'))} onClick={() => executeAndClose(() => editor.chain().focus().togglePullquote().run())}>
                                            <PullquoteIcon width={16} height={16} /> {t('editor.pullquote')}
                                        </button>
                                    )}
                                    <button type="button" className={getItemClass(editor.isActive('codeBlock'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleCodeBlock().run())}>
                                        <CodeIcon width={16} height={16} /> {t('editor.code')}
                                    </button>
                                    <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().setHorizontalRule().run())}>
                                        <DividerIcon width={16} height={16} /> {t('editor.divider')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {canAddLists && (
                        <div className={`relative flex items-center justify-between ${getItemClass()}`} onMouseEnter={() => setActiveSubmenu('lists')}>
                            <div className="flex items-center gap-[10px]"><ListBulletIcon width={16} height={16} /> {t('editor.lists')}</div>
                            <span className="text-[10px] text-text-muted">▶</span>

                            {activeSubmenu === 'lists' && (
                                <div className="absolute left-full bottom-[-4px] ml-[2px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col min-w-[180px] py-[4px] z-[101] rounded-[4px]">
                                    <button type="button" className={getItemClass(editor.isActive('orderedList'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleOrderedList().run())}>
                                        <ListOrderedIcon width={16} height={16} /> {t('editor.ordered_list')}
                                    </button>
                                    <button type="button" className={getItemClass(editor.isActive('bulletList'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleBulletList().run())}>
                                        <ListBulletIcon width={16} height={16} /> {t('editor.bullet_list')}
                                    </button>
                                    {typeof editor.commands.toggleTaskList === 'function' && (
                                        <button type="button" className={getItemClass(editor.isActive('taskList'))} onClick={() => executeAndClose(() => editor.chain().focus().toggleTaskList().run())}>
                                            <ListTaskIcon width={16} height={16} /> {t('editor.task_list')}
                                        </button>
                                    )}
                                    {typeof editor.commands.setDetails === 'function' && (
                                        <button type="button" className={getItemClass(editor.isActive('details'))} onClick={() => executeAndClose(() => editor.chain().focus().setDetails(t('editor.details_title'), t('editor.details_text')).run())}>
                                            <DividerIcon width={16} height={16} /> {t('editor.collapsible_block')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {canAddTables && (
                        <div className={`relative flex items-center justify-between ${getItemClass()}`} onMouseEnter={() => setActiveSubmenu('table')}>
                            <div className="flex items-center gap-[10px]"><TableIcon width={16} height={16} /> {t('editor.table')}</div>
                            <span className="text-[10px] text-text-muted">▶</span>

                            {activeSubmenu === 'table' && (
                                <div className="absolute left-full bottom-[-4px] ml-[2px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col min-w-[200px] py-[4px] z-[101] rounded-[4px]">
                                    {!editor.isActive('table') ? (
                                        <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}>
                                            <TableIcon width={16} height={16} /> {t('editor.insert_table')}
                                        </button>
                                    ) : (
                                        <>
                                            <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().addRowAfter().run())}>
                                                <TableAddRowIcon width={16} height={16} /> {t('editor.add_row')}
                                            </button>
                                            <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().addColumnAfter().run())}>
                                                <TableAddColIcon width={16} height={16} /> {t('editor.add_col')}
                                            </button>
                                            <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().mergeCells().run())}>
                                                <TableMergeIcon width={16} height={16} /> {t('editor.merge_cells')}
                                            </button>
                                            <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().splitCell().run())}>
                                                <TableMergeIcon width={16} height={16} /> {t('editor.split_cell')}
                                            </button>

                                            <div className="h-[1px] bg-border my-[4px]"></div>

                                            <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeaderRow().run())}>
                                                <HeadingIcon width={16} height={16} /> {t('editor.toggle_header_row')}
                                            </button>
                                            <button type="button" className={getItemClass()} onClick={() => executeAndClose(() => editor.chain().focus().toggleHeaderColumn().run())}>
                                                <HeadingIcon width={16} height={16} /> {t('editor.toggle_header_col')}
                                            </button>

                                            <div className="h-[1px] bg-border my-[4px]"></div>

                                            <button type="button" className={getItemClass(false, true)} onClick={() => executeAndClose(() => editor.chain().focus().deleteRow().run())}>
                                                <TableDelRowIcon width={16} height={16} /> {t('editor.delete_row')}
                                            </button>
                                            <button type="button" className={getItemClass(false, true)} onClick={() => executeAndClose(() => editor.chain().focus().deleteColumn().run())}>
                                                <TableDelColIcon width={16} height={16} /> {t('editor.delete_col')}
                                            </button>
                                            <button type="button" className={getItemClass(false, true)} onClick={() => executeAndClose(() => editor.chain().focus().deleteTable().run())}>
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