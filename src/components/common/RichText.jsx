import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension, Mark, mergeAttributes } from '@tiptap/core';

import { CustomStickerNode } from '../editor/CustomStickerNode';
import StickerTooltip from '../editor/StickerTooltip';
import { PullquoteNode, DetailsNode, SummaryNode } from '../editor/extensions';

import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Highlight } from '@tiptap/extension-highlight';

// 1. Імпортуємо 'all', щоб працювали ВСІ мови, включно з x86asm
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';

// 2. КРИТИЧНО ВАЖЛИВО: Імпортуємо CSS-тему, щоб з'явилися кольори!
import 'highlight.js/styles/github-dark.css';

const lowlight = createLowlight(all);

const SpoilerMark = Mark.create({
    name: 'spoiler',
    parseHTML() { return [{ tag: 'span[data-spoiler]' }]; },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-spoiler': 'true', class: 'tetrone-spoiler' }), 0];
    },
});

const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '19px', '20px', '22px', '24px'];

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() { return { types: ['textStyle'] }; },
    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                fontSize: {
                    default: null,
                    parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                    renderHTML: attributes => {
                        if (!attributes.fontSize || !ALLOWED_FONT_SIZES.includes(attributes.fontSize)) return {};
                        return { style: `font-size: ${attributes.fontSize}` };
                    },
                },
            },
        }];
    },
});

const getRichTextExtensions = () => [
    StarterKit.configure({ codeBlock: false }),
    TextStyle.configure(),
    Color.configure(),
    FontSize.configure(),
    SpoilerMark.configure(),
    CustomStickerNode.configure(),
    Mention.configure({ HTMLAttributes: { class: 'mention' } }),
    Underline.configure(),
    Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' } }),
    TaskList.configure(),
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow.configure(),
    TableHeader.configure(),
    TableCell.configure(),
    PullquoteNode.configure(),
    DetailsNode.configure(),
    SummaryNode.configure(),
    Subscript.configure(),
    Superscript.configure(),
    Highlight.configure({ multicolor: true }),
    CodeBlockLowlight.configure({ lowlight }),
];

const decodeHtmlEntities = (text) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
};

export const decodeTipTapContent = (content) => {
    if (!content) return content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map(decodeTipTapContent);
    if (typeof content === 'object') {
        const newObj = { ...content };
        if (newObj.type === 'text' && typeof newObj.text === 'string') {
            newObj.text = decodeHtmlEntities(newObj.text);
        }
        if (newObj.content) {
            newObj.content = decodeTipTapContent(newObj.content);
        }
        return newObj;
    }
    return content;
};

// 3. ОГОРТАЄМО У React.memo: Це зупинить нескінченні перерендери і ворнінги Tiptap
const RichText = React.memo(function RichText({ text, className = "tetrone-post-text" }) {
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);

    const [activeStickerId, setActiveStickerId] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isPinned, setIsPinned] = useState(false);
    const hideTimeoutRef = useRef(null);

    const htmlContent = useMemo(() => {
        if (!text || typeof text !== 'object') return null;
        try {
            const decodedText = decodeTipTapContent(text);
            return generateHTML(decodedText, getRichTextExtensions());
        } catch (error) {
            return null;
        }
    }, [text]);

    // ТУТ БУВ useEffect для highlight.js - ВІН ПОВНІСТЮ ВИДАЛЕНИЙ!
    // CodeBlockLowlight робить все автоматично і на 100% безпечно від XSS.

    const showTooltip = (target, pinned = false) => {
        clearTimeout(hideTimeoutRef.current);
        const packname = target.getAttribute('data-pack-name');
        const rect = target.getBoundingClientRect();

        if (packname) {
            setTooltipPosition({
                x: rect.left + window.scrollX + (rect.width / 2),
                y: rect.top + window.scrollY - 10
            });
            setActiveStickerId(packname);
            if (pinned) setIsPinned(true);
        }
    };

    const handleMouseOver = useCallback((e) => {
        if (isPinned) return;
        const target = e.target;
        if (target && target.classList.contains('tetrone-micro-sticker')) {
            showTooltip(target, false);
        }
    }, [isPinned]);

    const handleMouseOut = useCallback((e) => {
        if (isPinned) return;
        const target = e.target;
        if (target && target.classList.contains('tetrone-micro-sticker')) {
            hideTimeoutRef.current = setTimeout(() => { setActiveStickerId(null); }, 300);
        }
    }, [isPinned]);

    const handleClick = useCallback((e) => {
        const target = e.target;
        if (target && target.classList.contains('tetrone-spoiler')) {
            target.classList.toggle('revealed');
            return;
        }

        if (target && target.classList.contains('tetrone-micro-sticker')) {
            e.preventDefault();
            e.stopPropagation();
            const shortcode = target.getAttribute('data-shortcode');

            if (isPinned && activeStickerId === shortcode) {
                setIsPinned(false);
                setActiveStickerId(null);
            } else {
                showTooltip(target, true);
            }
        }
    }, [isPinned, activeStickerId]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (isPinned) {
                if (tooltipRef.current && !tooltipRef.current.contains(e.target) && !e.target.classList.contains('tetrone-micro-sticker')) {
                    setIsPinned(false);
                    setActiveStickerId(null);
                }
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && activeStickerId) {
                setIsPinned(false);
                setActiveStickerId(null);
            }
        };
        document.addEventListener('click', handleGlobalClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPinned, activeStickerId]);

    const handleTooltipMouseEnter = () => { if (!isPinned) clearTimeout(hideTimeoutRef.current); };
    const handleTooltipMouseLeave = () => {
        if (!isPinned) {
            hideTimeoutRef.current = setTimeout(() => { setActiveStickerId(null); }, 300);
        }
    };

    if (!htmlContent) return null;

    return (
        <>
            <div
                ref={containerRef}
                className={className}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
                onClick={handleClick}
            />
            {activeStickerId && (
                <div
                    ref={tooltipRef}
                    onMouseEnter={handleTooltipMouseEnter}
                    onMouseLeave={handleTooltipMouseLeave}
                    className="tetrone-tooltip-wrapper"
                >
                    <StickerTooltip
                        shortcode={activeStickerId}
                        position={tooltipPosition}
                    />
                </div>
            )}
        </>
    );
});

export default RichText;