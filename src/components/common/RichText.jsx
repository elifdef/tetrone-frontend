import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import truncate from 'truncate-html';

import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

import { CustomStickerNode } from '../editor/extensions/CustomStickerNode.js';
import StickerTooltip from '../editor/StickerTooltip';
import { PullquoteNode, DetailsNode, SummaryNode } from '../editor/extensions/extensions.js';

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

// НОВІ ІМПОРТИ
import TextAlign from '@tiptap/extension-text-align';
import { UniqueId } from '../editor/extensions/UniqueId.js';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

// Іконка для копіювання
const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const SpoilerMark = Mark.create({
    name: 'spoiler',
    parseHTML() { return [{ tag: 'span[data-spoiler]' }]; },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-spoiler': 'true', class: 'spoiler-inline' }), 0];
    },
});

const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px'];

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

const HashtagMark = Mark.create({
    name: 'hashtag',
    addAttributes() { return { 'data-hashtag': { default: null } }; },
    parseHTML() { return [{ tag: 'span[data-hashtag]' }]; },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'text-theme-link font-bold hover:underline cursor-pointer hashtag-link' }), 0];
    },
});

// ФІКС: Додали нові плагіни в масив рендерера
const RICH_TEXT_EXTENSIONS = [
    StarterKit.configure(),
    TextStyle.configure(),
    FontFamily.configure(),
    Color.configure(),
    FontSize.configure(),
    SpoilerMark.configure(),
    CustomStickerNode.configure(),
    Mention.configure({ HTMLAttributes: { class: 'user-mention' } }),
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
    HashtagMark.configure(),

    // ДОДАНО СЮДИ:
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    UniqueId.configure({ types: ['heading', 'paragraph', 'blockquote', 'codeBlock', 'bulletList', 'orderedList', 'listItem'] }),
];

const decodeHtmlEntities = (text) => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
};

// Санітайзер для видалення "битих" нод
export const decodeTipTapContent = (content) => {
    if (!content) return content;
    if (typeof content === 'string') return content;

    if (Array.isArray(content)) {
        return content
        .map(decodeTipTapContent)
        .filter(node => {
            if (node && node.type === 'text' && typeof node.text !== 'string') return false;
            return true;
        });
    }

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

const processHashtags = (content) => {
    if (!content) return content;
    if (Array.isArray(content)) return content.map(processHashtags);

    if (typeof content === 'object') {
        const newObj = { ...content };

        if (newObj.content && Array.isArray(newObj.content)) {
            const newChildren = [];

            newObj.content.forEach(child => {
                if (child.type === 'text' && typeof child.text === 'string' &&
                    (!child.marks || !child.marks.some(m => m.type === 'link' || m.type === 'hashtag'))) {

                    const regex = /(#[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9_]+)/gu;
                    const parts = child.text.split(regex);

                    if (parts.length === 1) {
                        newChildren.push(processHashtags(child));
                    } else {
                        parts.forEach(part => {
                            if (part.match(regex)) {
                                const marks = child.marks ? [...child.marks] : [];
                                marks.push({
                                    type: 'hashtag',
                                    attrs: {
                                        'data-hashtag': part.slice(1).toLowerCase()
                                    }
                                });
                                newChildren.push({ type: 'text', text: part, marks: marks });
                            } else if (part) {
                                newChildren.push({ ...child, text: part });
                            }
                        });
                    }
                } else {
                    newChildren.push(processHashtags(child));
                }
            });
            newObj.content = newChildren;
        }
        return newObj;
    }
    return content;
};

const RichText = React.memo(function RichText({ text, className = "post-text", limit = 500 }) {
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);
    const navigate = useNavigate();

    const [activeStickerId, setActiveStickerId] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isPinned, setIsPinned] = useState(false);
    const hideTimeoutRef = useRef(null);

    const [isExpanded, setIsExpanded] = useState(false);

    const { finalHtml, requiresExpansion } = useMemo(() => {
        if (!text || typeof text !== 'object') return { finalHtml: null, requiresExpansion: false };

        try {
            const decodedText = decodeTipTapContent(text);
            const withHashtags = processHashtags(decodedText);

            const rawHtml = generateHTML(withHashtags, RICH_TEXT_EXTENSIONS);

            const plainTextLength = rawHtml.replace(/<[^>]+>/g, '').length;
            const needsExp = plainTextLength > limit;

            if (needsExp && !isExpanded) {
                const truncatedHtml = truncate(rawHtml, limit, { byWords: true, ellipsis: '...' });
                return { finalHtml: truncatedHtml, requiresExpansion: true };
            }

            return { finalHtml: rawHtml, requiresExpansion: needsExp };
        } catch (error) {
            console.error("RichText Render Error:", error);
            return { finalHtml: null, requiresExpansion: false };
        }
    }, [text, isExpanded, limit]);

    useEffect(() => {
        if (!containerRef.current) return;

        const preElements = containerRef.current.querySelectorAll('pre');

        preElements.forEach((pre) => {
            const codeBlock = pre.querySelector('code');
            if (!codeBlock) return;

            if (!codeBlock.classList.contains('hljs')) {
                hljs.highlightElement(codeBlock);
            }

            if (pre.querySelector('.code-header')) return;

            let langName = 'text';
            const langClass = Array.from(codeBlock.classList).find(c => c.startsWith('language-'));

            if (langClass) {
                langName = langClass.replace('language-', '');
            } else if (codeBlock.result?.language) {
                langName = codeBlock.result.language;
            }

            const header = document.createElement('div');
            header.className = 'code-header absolute top-0 left-0 right-0 flex justify-between items-center px-[8px] py-[4px] border-b';
            header.style.backgroundColor = 'var(--rt-table-th-bg)';
            header.style.borderColor = 'var(--theme-border)';

            const langSpan = document.createElement('span');
            langSpan.className = 'font-bold uppercase text-[9px] tracking-[1px]';
            langSpan.style.color = 'var(--theme-text-muted)';
            langSpan.innerText = langName;

            const copyBtn = document.createElement('button');
            copyBtn.className = 'bg-transparent border-none cursor-pointer flex items-center gap-[4px] p-[2px] transition-colors hover:opacity-70 outline-none';
            copyBtn.style.color = 'var(--theme-link)';
            copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span class="text-[9px] font-bold">Copy</span>`;

            copyBtn.onclick = () => {
                navigator.clipboard.writeText(codeBlock.innerText).then(() => {
                    const span = copyBtn.querySelector('span');
                    span.innerText = t('action.copied') || 'Copied!';
                    copyBtn.style.color = 'var(--theme-success)';
                    setTimeout(() => {
                        if(span) span.innerText = 'Copy';
                        copyBtn.style.color = 'var(--theme-link)';
                    }, 2000);
                });
            };

            header.appendChild(langSpan);
            header.appendChild(copyBtn);
            pre.insertBefore(header, codeBlock);
        });
    }, [finalHtml, t]);

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
        if (target && target.classList.contains('micro-sticker')) {
            showTooltip(target, false);
        }
    }, [isPinned]);

    const handleMouseOut = useCallback((e) => {
        if (isPinned) return;
        const target = e.target;
        if (target && target.classList.contains('micro-sticker')) {
            hideTimeoutRef.current = setTimeout(() => { setActiveStickerId(null); }, 300);
        }
    }, [isPinned]);

    const handleClick = useCallback((e) => {
        const target = e.target;
        if (target && target.classList.contains('spoiler-inline')) {
            target.classList.toggle('revealed');
            return;
        }

        if (target && target.classList.contains('hashtag-link')) {
            e.preventDefault();
            e.stopPropagation();
            const tag = target.getAttribute('data-hashtag');
            navigate(`/?tab=global&hashtag=${tag}`);
            return;
        }

        if (target && target.classList.contains('micro-sticker')) {
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
    }, [isPinned, activeStickerId, navigate]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (isPinned) {
                if (tooltipRef.current && !tooltipRef.current.contains(e.target) && !e.target.classList.contains('micro-sticker')) {
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

    if (!finalHtml) return null;

    return (
        <>
            <div
                ref={containerRef}
                className={className}
                dangerouslySetInnerHTML={{ __html: finalHtml }}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
                onClick={handleClick}
            />

            {requiresExpansion && !isExpanded && (
                <div
                    className="inline-block text-theme-link cursor-pointer text-[11px] font-bold mt-[8px] hover:underline"
                    onClick={() => setIsExpanded(true)}
                >
                    {t('action.show_more')}
                </div>
            )}

            {activeStickerId && (
                <div
                    ref={tooltipRef}
                    onMouseEnter={handleTooltipMouseEnter}
                    onMouseLeave={handleTooltipMouseLeave}
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