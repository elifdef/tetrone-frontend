import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FormatBoldIcon, FormatItalicIcon, FormatUnderlineIcon, FormatStrikeIcon,
    FormatLinkIcon, EyeOffIcon, HeadingIcon, QuoteIcon, CodeIcon,
    ListBulletIcon, ListOrderedIcon, TableIcon, TableAddRowIcon, TableAddColIcon,
    TableDelRowIcon, TableDelColIcon, CloseIcon, TextIcon, DividerIcon,
    SubscriptIcon, SuperscriptIcon, HighlightIcon, PullquoteIcon, ListTaskIcon,
    TableMergeIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon
} from '../ui/Icons';

export default function FloatingFormatMenu({ editor, isOpen, onClose }) {
    const { t } = useTranslation();
    const menuRef = useRef(null);

    const pos = useRef({ x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 200 });
    const vel = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ startX: 0, startY: 0 });
    const frameRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            cancelAnimationFrame(frameRef.current);
            return;
        }

        if (menuRef.current) {
            menuRef.current.style.left = `${pos.current.x}px`;
            menuRef.current.style.top = `${pos.current.y}px`;
        }

        const animate = () => {
            if (!menuRef.current || isDragging.current) return;

            if (Math.abs(vel.current.x) > 0.1 || Math.abs(vel.current.y) > 0.1) {
                const rect = menuRef.current.getBoundingClientRect();
                let nx = pos.current.x + vel.current.x;
                let ny = pos.current.y + vel.current.y;

                if (nx <= 0) { nx = 0; vel.current.x *= -1; }
                if (ny <= 0) { ny = 0; vel.current.y *= -1; }
                if (nx + rect.width >= window.innerWidth) { nx = window.innerWidth - rect.width; vel.current.x *= -1; }
                if (ny + rect.height >= window.innerHeight) { ny = window.innerHeight - rect.height; vel.current.y *= -1; }

                pos.current.x = nx;
                pos.current.y = ny;
                menuRef.current.style.left = `${nx}px`;
                menuRef.current.style.top = `${ny}px`;

                frameRef.current = requestAnimationFrame(animate);
            }
        };

        if (localStorage.getItem('DVD') === 'true') {
            frameRef.current = requestAnimationFrame(animate);
        }

        return () => cancelAnimationFrame(frameRef.current);
    }, [isOpen]);

    const handleMouseDown = (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
        
        isDragging.current = true;
        cancelAnimationFrame(frameRef.current);
        
        lastMouse.current = { 
            startX: e.clientX - pos.current.x,
            startY: e.clientY - pos.current.y
        };

        const onMouseMove = (ev) => {
            if (!isDragging.current) return;
            vel.current = { x: ev.movementX, y: ev.movementY };

            let newX = ev.clientX - lastMouse.current.startX;
            let newY = ev.clientY - lastMouse.current.startY;

            if (menuRef.current) {
                const rect = menuRef.current.getBoundingClientRect();
                newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
                newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));
            }

            pos.current = { x: newX, y: newY };
            menuRef.current.style.left = `${newX}px`;
            menuRef.current.style.top = `${newY}px`;
        };

        const onMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            if (localStorage.getItem('DVD') === 'true') {
                if (Math.abs(vel.current.x) > 1 || Math.abs(vel.current.y) > 1) {
                    const triggerAnimate = () => {
                        if (!menuRef.current || isDragging.current) return;
                        const rect = menuRef.current.getBoundingClientRect();
                        let nx = pos.current.x + vel.current.x;
                        let ny = pos.current.y + vel.current.y;

                        if (nx <= 0) { nx = 0; vel.current.x *= -1; }
                        if (ny <= 0) { ny = 0; vel.current.y *= -1; }
                        if (nx + rect.width >= window.innerWidth) { nx = window.innerWidth - rect.width; vel.current.x *= -1; }
                        if (ny + rect.height >= window.innerHeight) { ny = window.innerHeight - rect.height; vel.current.y *= -1; }

                        pos.current.x = nx;
                        pos.current.y = ny;
                        menuRef.current.style.left = `${nx}px`;
                        menuRef.current.style.top = `${ny}px`;
                        frameRef.current = requestAnimationFrame(triggerAnimate);
                    };
                    frameRef.current = requestAnimationFrame(triggerAnimate);
                }
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    if (!editor || !isOpen) return null;

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

    const Btn = ({ active, onClick, children, title }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`flex items-center justify-center w-[30px] h-[30px] transition-colors outline-none rounded-[2px] ${active ? 'bg-[rgba(0,102,204,0.1)] text-theme-link border border-theme-link/30' : 'bg-transparent text-text-main border border-transparent hover:bg-bg-page hover:border-border'}`}
        >
            {children}
        </button>
    );

    const BlockBtn = ({ active, danger, onClick, icon, label }) => (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-[8px] p-[6px_10px] text-[12px] transition-colors outline-none border w-full text-left rounded-[2px] ${active ? 'bg-[rgba(0,102,204,0.1)] text-theme-link border-theme-link/30' : danger ? 'bg-transparent text-theme-error border-transparent hover:bg-[rgba(255,51,71,0.1)] hover:border-theme-error/30' : 'bg-transparent text-text-main border-transparent hover:bg-bg-page hover:border-border'}`}
        >
            {icon} <span className="truncate">{label}</span>
        </button>
    );

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-bg-box border border-border shadow-[0_15px_40px_rgba(0,0,0,0.4)] w-[340px] flex flex-col overflow-hidden font-tahoma rounded-[2px]"
        >
            <div
                className="bg-modal-header-bg text-modal-header-text border-b border-border py-[8px] px-[12px] flex justify-between items-center cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
            >
                <h3 className="m-0 text-[12px] font-bold text-modal-header-text flex items-center gap-[6px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                    {t('editor.format_panel_title')}
                </h3>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="bg-transparent border-none text-modal-header-text text-[14px] leading-none cursor-pointer p-0 opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center outline-none"
                    title={t('action.close')}
                >
                    <CloseIcon width={14} height={14} />
                </button>
            </div>

            <div className="p-[12px] flex flex-col gap-[15px] max-h-[450px] overflow-y-auto custom-scrollbar">
                
                <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider px-[2px]">{t('editor.category_styles')}</span>
                    <div className="flex flex-wrap gap-[2px] bg-input-bg p-[4px] border border-input-border rounded-[2px]">
                        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title={t('editor.bold')}><FormatBoldIcon width={16}/></Btn>
                        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title={t('editor.italic')}><FormatItalicIcon width={16}/></Btn>
                        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title={t('editor.underline')}><FormatUnderlineIcon width={16}/></Btn>
                        <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title={t('editor.strike')}><FormatStrikeIcon width={16}/></Btn>
                        <Btn active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()} title={t('editor.subscript')}><SubscriptIcon width={16}/></Btn>
                        <Btn active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} title={t('editor.superscript')}><SuperscriptIcon width={16}/></Btn>
                        <Btn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title={t('editor.highlight')}><HighlightIcon width={16}/></Btn>
                        <Btn active={editor.isActive('spoiler')} onClick={() => editor.chain().focus().toggleSpoiler().run()} title={t('editor.spoiler')}><EyeOffIcon width={16}/></Btn>
                        <Btn active={editor.isActive('link')} onClick={setLink} title={t('editor.link')}><FormatLinkIcon width={16}/></Btn>
                    </div>
                </div>

                {typeof editor.commands.setColor === 'function' && (
                    <div className="flex items-center gap-[6px]">
                        <div className="flex items-center gap-[4px] bg-input-bg border border-input-border p-[2px_6px] rounded-[2px]">
                            <input type="color" className="w-[20px] h-[20px] p-0 border-none cursor-pointer bg-transparent outline-none" title={t('editor.text_color')} value={editor.getAttributes('textStyle').color || '#000000'} onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
                            <div className="w-[1px] h-[14px] bg-border mx-[2px]"></div>
                            <input type="color" className="w-[20px] h-[20px] p-0 border-none cursor-pointer bg-transparent outline-none" title={t('editor.highlight_color')} value={editor.getAttributes('highlight').color || '#ffff00'} onChange={e => editor.chain().focus().setHighlight({ color: e.target.value }).run()} />
                        </div>
                        <select className="flex-1 bg-input-bg border border-input-border text-[11px] p-[6px] outline-none focus:border-theme-link rounded-[2px]" value={editor.getAttributes('textStyle').fontFamily || ''} onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}>
                            <option value="">{t('editor.font_default')}</option>
                            {ALLOWED_FONTS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
                        </select>
                        <select className="w-[50px] bg-input-bg border border-input-border text-[11px] p-[6px] outline-none focus:border-theme-link rounded-[2px]" value={editor.getAttributes('textStyle').fontSize || ''} onChange={e => editor.chain().focus().setFontSize(e.target.value).run()}>
                            <option value="">A</option>
                            {ALLOWED_FONT_SIZES.map(s => <option key={s} value={s}>{s.replace('px','')}</option>)}
                        </select>
                    </div>
                )}

                <div className="h-[1px] bg-border"></div>

                <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider px-[2px]">{t('editor.category_align')}</span>
                    <div className="grid grid-cols-2 gap-[4px]">
                        <BlockBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<AlignLeftIcon width={14}/>} label={t('editor.align_left')} />
                        <BlockBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<AlignCenterIcon width={14}/>} label={t('editor.align_center')} />
                        <BlockBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<AlignRightIcon width={14}/>} label={t('editor.align_right')} />
                        <BlockBtn active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} icon={<TextIcon width={14}/>} label={t('editor.paragraph')} />
                    </div>
                </div>

                <div className="h-[1px] bg-border"></div>

                {/* Категорія: Заголовки */}
                <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider px-[2px]">{t('editor.category_headers')}</span>
                    <div className="grid grid-cols-2 gap-[4px]">
                        <BlockBtn active={editor.isActive('heading', {level: 1})} onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()} icon={<HeadingIcon width={14}/>} label={t('editor.heading_1')} />
                        <BlockBtn active={editor.isActive('heading', {level: 2})} onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()} icon={<HeadingIcon width={14}/>} label={t('editor.heading_2')} />
                        <BlockBtn active={editor.isActive('heading', {level: 3})} onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()} icon={<HeadingIcon width={14}/>} label={t('editor.heading_3')} />
                        <BlockBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<DividerIcon width={14}/>} label={t('editor.divider')} />
                    </div>
                </div>

                <div className="h-[1px] bg-border"></div>

                <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider px-[2px]">{t('editor.category_lists')}</span>
                    <div className="grid grid-cols-2 gap-[4px]">
                        <BlockBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<ListBulletIcon width={14}/>} label={t('editor.bullet_list')} />
                        <BlockBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrderedIcon width={14}/>} label={t('editor.ordered_list')} />
                        {typeof editor.commands.toggleTaskList === 'function' && (
                            <div className="col-span-2">
                                <BlockBtn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} icon={<ListTaskIcon width={14}/>} label={t('editor.task_list')} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-[1px] bg-border"></div>

                <div className="flex flex-col gap-[4px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider px-[2px]">{t('editor.category_blocks')}</span>
                    <div className="grid grid-cols-2 gap-[4px]">
                        <BlockBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<QuoteIcon width={14}/>} label={t('editor.blockquote')} />
                        {typeof editor.commands.togglePullquote === 'function' && (
                            <BlockBtn active={editor.isActive('pullquote')} onClick={() => editor.chain().focus().togglePullquote().run()} icon={<PullquoteIcon width={14}/>} label={t('editor.pullquote')} />
                        )}
                        <BlockBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={<CodeIcon width={14}/>} label={t('editor.code')} />
                        {typeof editor.commands.setDetails === 'function' && (
                            <BlockBtn active={editor.isActive('details')} onClick={() => editor.chain().focus().setDetails(t('editor.details_title'), t('editor.details_text')).run()} icon={<DividerIcon width={14}/>} label={t('editor.collapsible_block')} />
                        )}
                    </div>
                </div>

                {typeof editor.commands.insertTable === 'function' && (
                    <>
                        <div className="h-[1px] bg-border mt-[4px]"></div>
                        <div className="flex flex-col gap-[4px]">
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider px-[4px]">{t('editor.category_tables')}</span>
                            <div className="grid grid-cols-2 gap-[4px]">
                                {!editor.isActive('table') ? (
                                    <div className="col-span-2">
                                        <BlockBtn onClick={() => editor.chain().focus().insertTable({rows: 3, cols: 3, withHeaderRow: true}).run()} icon={<TableIcon width={14}/>} label={t('editor.insert_table')} />
                                    </div>
                                ) : (
                                    <>
                                        <BlockBtn onClick={() => editor.chain().focus().addRowAfter().run()} icon={<TableAddRowIcon width={14}/>} label={t('editor.add_row')} />
                                        <BlockBtn onClick={() => editor.chain().focus().addColumnAfter().run()} icon={<TableAddColIcon width={14}/>} label={t('editor.add_col')} />
                                        <BlockBtn onClick={() => editor.chain().focus().mergeCells().run()} icon={<TableMergeIcon width={14}/>} label={t('editor.merge_cells')} />
                                        <BlockBtn onClick={() => editor.chain().focus().splitCell().run()} icon={<TableMergeIcon width={14}/>} label={t('editor.split_cell')} />
                                        <BlockBtn onClick={() => editor.chain().focus().toggleHeaderRow().run()} icon={<HeadingIcon width={14}/>} label={t('editor.toggle_header_row')} />
                                        <BlockBtn onClick={() => editor.chain().focus().toggleHeaderColumn().run()} icon={<HeadingIcon width={14}/>} label={t('editor.toggle_header_col')} />
                                        <BlockBtn danger onClick={() => editor.chain().focus().deleteRow().run()} icon={<TableDelRowIcon width={14}/>} label={t('editor.delete_row')} />
                                        <BlockBtn danger onClick={() => editor.chain().focus().deleteColumn().run()} icon={<TableDelColIcon width={14}/>} label={t('editor.delete_col')} />
                                        <div className="col-span-2">
                                            <BlockBtn danger onClick={() => editor.chain().focus().deleteTable().run()} icon={<TableIcon width={14}/>} label={t('editor.delete_table')} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}