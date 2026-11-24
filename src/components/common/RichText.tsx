import React, { useMemo, useState, useRef, useCallback, useEffect, type MouseEvent } from 'react';
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
import { CustomStickerNode } from '../editor/extensions/CustomStickerNode';
import StickerTooltip, { type StickerTooltipSample } from '../editor/StickerTooltip';
import { PullquoteNode, DetailsNode, SummaryNode } from '../editor/extensions/extensions';
import StickerService from '../../services/sticker.service';
import userService from '../../services/user.service';
import UserMiniCard from './UserMiniCard';
import { notifyError, notifySuccess } from '../common/Notify';
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
import TextAlign from '@tiptap/extension-text-align';
import { UniqueId } from '../editor/extensions/UniqueId';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { decodeTipTapContent, ensureMentionSpacing, processHashtags } from '../../utils/tiptapContent';
import type { TipTapDoc } from '@/types/tiptap';
import type { UserData } from '@/types/user';

export interface RichTextProps {
    text?: TipTapDoc | Record<string, unknown> | string | null;
    className?: string;
    limit?: number;
}

interface StickerPackInfo {
    short_name?: string;
    title?: string;
    is_installed?: boolean;
    [key: string]: unknown;
}

interface TooltipPosition {
    x: number;
    y: number;
}

interface StickerTooltipState {
    packName: string;
    position: TooltipPosition;
    info: StickerPackInfo | null;
    samples: StickerTooltipSample[];
}

interface MentionTooltipState {
    username: string;
    position: TooltipPosition;
    user: UserData | null;
    isLoading: boolean;
    notFound: boolean;
}

const SpoilerMark = Mark.create({
    name: 'spoiler',
    parseHTML() {
        return [{ tag: 'span[data-spoiler]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-spoiler': 'true', class: 'spoiler-inline' }), 0];
    },
});

const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px'];

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return { types: ['textStyle'] };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]+/g, ''),
                        renderHTML: (attributes: Record<string, unknown>) => {
                            const size = attributes.fontSize as string | undefined;
                            if (!size || !ALLOWED_FONT_SIZES.includes(size)) return {};
                            return { style: `font-size: ${size}` };
                        },
                    },
                },
            },
        ];
    },
});

const HashtagMark = Mark.create({
    name: 'hashtag',
    addAttributes() {
        return { 'data-hashtag': { default: null } };
    },
    parseHTML() {
        return [{ tag: 'span[data-hashtag]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                class: 'text-theme-link font-bold hover:underline cursor-pointer hashtag-link',
            }),
            0,
        ];
    },
});

const RICH_TEXT_EXTENSIONS = [
    StarterKit.configure({
        link: false,
        underline: false,
    }),
    TextStyle.configure(),
    FontFamily.configure(),
    Color.configure(),
    FontSize.configure(),
    SpoilerMark.configure(),
    CustomStickerNode.configure(),
    Mention.configure({
        HTMLAttributes: { class: 'user-mention text-theme-link font-bold hover:underline cursor-pointer' },
    }),
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
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    UniqueId.configure({
        types: ['heading', 'paragraph', 'blockquote', 'codeBlock', 'bulletList', 'orderedList', 'listItem'],
    }),
];

const packInfoCache: Record<string, { info: StickerPackInfo; samples: StickerTooltipSample[] }> = {};
const userProfileCache: Record<string, UserData | null> = {};

const RichText = React.memo(function RichText({ text, className = 'post-text', limit = 500 }: RichTextProps) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    const [isExpanded, setIsExpanded] = useState(false);
    const [tooltipData, setTooltipData] = useState<StickerTooltipState | null>(null);
    const [isLoadingTooltip, setIsLoadingTooltip] = useState(false);

    const [mentionTooltip, setMentionTooltip] = useState<MentionTooltipState | null>(null);
    const mentionOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mentionCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { finalHtml, requiresExpansion } = useMemo(() => {
        if (!text || typeof text !== 'object') return { finalHtml: null, requiresExpansion: false };

        try {
            const decodedText = decodeTipTapContent(text);
            const withMentionsSpacing = ensureMentionSpacing(decodedText);
            const withHashtags = processHashtags(withMentionsSpacing);

            const rawHtml = generateHTML(withHashtags as Record<string, unknown>, RICH_TEXT_EXTENSIONS);

            const plainTextLength = rawHtml.replace(/<[^>]+>/g, '').length;
            const needsExp = plainTextLength > limit;

            if (needsExp && !isExpanded) {
                const truncatedHtml = truncate(rawHtml, limit, { byWords: true, ellipsis: '...' });
                return { finalHtml: truncatedHtml, requiresExpansion: true };
            }

            return { finalHtml: rawHtml, requiresExpansion: needsExp };
        } catch (error) {
            console.error('RichText Render Error:', error);
            return { finalHtml: null, requiresExpansion: false };
        }
    }, [text, isExpanded, limit]);

    useEffect(() => {
        if (!containerRef.current) return;

        const preElements = containerRef.current.querySelectorAll('pre');

        preElements.forEach((pre) => {
            const codeBlock = pre.querySelector('code') as (HTMLElement & { result?: { language?: string } }) | null;
            if (!codeBlock) return;

            if (!codeBlock.classList.contains('hljs')) {
                hljs.highlightElement(codeBlock);
            }

            if (pre.querySelector('.code-header')) return;

            let langName = 'text';
            const langClass = Array.from(codeBlock.classList).find((c) => c.startsWith('language-'));

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
            langSpan.textContent = langName;

            const copyBtn = document.createElement('button');
            copyBtn.className = 'bg-transparent border-none cursor-pointer flex items-center gap-[4px] p-[2px] transition-colors hover:opacity-70 outline-none';
            copyBtn.style.color = 'var(--theme-link)';
            copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span class="text-[9px] font-bold">Copy</span>`;

            copyBtn.onclick = () => {
                void navigator.clipboard.writeText(codeBlock.textContent ?? '').then(() => {
                    const span = copyBtn.querySelector('span');
                    if (span) span.textContent = t('action.copied');
                    copyBtn.style.color = 'var(--theme-success)';
                    setTimeout(() => {
                        if (span) span.textContent = 'Copy';
                        copyBtn.style.color = 'var(--theme-link)';
                    }, 2000);
                });
            };

            header.appendChild(langSpan);
            header.appendChild(copyBtn);
            pre.insertBefore(header, codeBlock);
        });
    }, [finalHtml, t]);

    const handleClick = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            const target = e.target as HTMLElement | null;
            if (target && target.classList.contains('spoiler-inline')) {
                target.classList.toggle('revealed');
                return;
            }

            const mentionEl = target?.closest?.('.user-mention');
            if (mentionEl) {
                e.preventDefault();
                e.stopPropagation();
                const username = mentionEl.getAttribute('data-id') || mentionEl.textContent?.replace(/^@/, '').trim();
                if (username) {
                    navigate(`/${username}`);
                }
                return;
            }

            if (target && target.classList.contains('hashtag-link')) {
                e.preventDefault();
                e.stopPropagation();
                const tag = target.getAttribute('data-hashtag');
                navigate(`/?tab=global&hashtag=${tag}`);
                return;
            }

            if (target && (target.classList.contains('micro-sticker') || target.tagName === 'IMG')) {
                e.preventDefault();
                e.stopPropagation();

                let packName = target.getAttribute('data-pack-name');
                const imgTarget = target as HTMLImageElement;
                if (!packName && imgTarget.src) {
                    const match = imgTarget.src.match(/\/storage\/emojis\/([^/]+)\//);
                    if (match) packName = match[1];
                }

                if (!packName) return;

                const rect = target.getBoundingClientRect();
                const position: TooltipPosition = {
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY + 5,
                };

                if (tooltipData && tooltipData.packName === packName) {
                    setTooltipData(null);
                    return;
                }

                if (packInfoCache[packName]) {
                    setTooltipData({
                        packName,
                        position,
                        info: packInfoCache[packName].info,
                        samples: packInfoCache[packName].samples,
                    });
                    return;
                }

                setIsLoadingTooltip(true);
                setTooltipData({ packName, position, info: null, samples: [] });

                StickerService.getStickerInfo(packName)
                    .onSuccess((res) => {
                        const packData = (res.pack || {}) as StickerPackInfo;
                        const samplesData = Array.isArray(res.samples) ? (res.samples as StickerTooltipSample[]) : [];

                        packInfoCache[packName!] = {
                            info: packData,
                            samples: samplesData,
                        };

                        setTooltipData({
                            packName: packName!,
                            position,
                            info: packData,
                            samples: samplesData,
                        });
                        setIsLoadingTooltip(false);
                    })
                    .onError((err) => {
                        notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                        setIsLoadingTooltip(false);
                        setTooltipData(null);
                    });
            }
        },
        [navigate, tooltipData, t]
    );

    const handleInstallPack = useCallback(
        (packShortName?: string) => {
            if (!packShortName) return;
            StickerService.installPack(packShortName)
                .onSuccess((res) => {
                    notifySuccess(t(`api.success.${res.code || 'PACK_INSTALLED'}`));
                    if (packInfoCache[packShortName]) {
                        packInfoCache[packShortName].info.is_installed = true;
                    }
                    setTooltipData((prev) =>
                        prev ? { ...prev, info: { ...prev.info, is_installed: true } } : null
                    );
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                });
        },
        [t]
    );

    useEffect(() => {
        const handleOutsideClick = (e: globalThis.MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (
                tooltipRef.current &&
                target &&
                !tooltipRef.current.contains(target) &&
                !target.classList.contains('micro-sticker')
            ) {
                setTooltipData(null);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, []);

    useEffect(() => {
        return () => {
            if (mentionOpenTimerRef.current) clearTimeout(mentionOpenTimerRef.current);
            if (mentionCloseTimerRef.current) clearTimeout(mentionCloseTimerRef.current);
        };
    }, []);

    const scheduleMentionClose = useCallback(() => {
        if (mentionOpenTimerRef.current) clearTimeout(mentionOpenTimerRef.current);
        if (mentionCloseTimerRef.current) clearTimeout(mentionCloseTimerRef.current);
        mentionCloseTimerRef.current = setTimeout(() => {
            setMentionTooltip(null);
        }, 200);
    }, []);

    const handleMouseOver = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            const target = e.target as HTMLElement | null;
            const mentionEl = target?.closest?.('.user-mention');
            if (!mentionEl) return;

            if (mentionCloseTimerRef.current) clearTimeout(mentionCloseTimerRef.current);

            const username = mentionEl.getAttribute('data-id') || mentionEl.textContent?.replace(/^@/, '').trim();
            if (!username) return;

            if (mentionTooltip?.username === username) return;

            if (mentionOpenTimerRef.current) clearTimeout(mentionOpenTimerRef.current);
            mentionOpenTimerRef.current = setTimeout(() => {
                const rect = mentionEl.getBoundingClientRect();
                const cardWidth = 250;
                const position: TooltipPosition = {
                    x: Math.max(8, Math.min(rect.left, window.innerWidth - cardWidth - 12)),
                    y: rect.bottom + 5,
                };

                if (Object.prototype.hasOwnProperty.call(userProfileCache, username)) {
                    const cachedUser = userProfileCache[username];
                    setMentionTooltip({
                        username,
                        position,
                        user: cachedUser,
                        isLoading: false,
                        notFound: cachedUser === null,
                    });
                    return;
                }

                setMentionTooltip({
                    username,
                    position,
                    user: null,
                    isLoading: true,
                    notFound: false,
                });

                userService
                    .getUser(username)
                    .onSuccess((res) => {
                        const userData = (res?.user || res) as UserData | null;
                        userProfileCache[username] = userData || null;
                        setMentionTooltip((prev) =>
                            prev && prev.username === username
                                ? { ...prev, user: userData || null, isLoading: false, notFound: !userData }
                                : prev
                        );
                    })
                    .onError(() => {
                        userProfileCache[username] = null;
                        setMentionTooltip((prev) =>
                            prev && prev.username === username
                                ? { ...prev, user: null, isLoading: false, notFound: true }
                                : prev
                        );
                    });
            }, 300);
        },
        [mentionTooltip]
    );

    const handleMouseOut = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            const target = e.target as HTMLElement | null;
            const mentionEl = target?.closest?.('.user-mention');
            if (!mentionEl) return;
            if (e.relatedTarget instanceof Node && mentionEl.contains(e.relatedTarget)) return;
            scheduleMentionClose();
        },
        [scheduleMentionClose]
    );

    if (!finalHtml) return null;

    return (
        <>
            <div
                ref={containerRef}
                className={className}
                dangerouslySetInnerHTML={{ __html: finalHtml }}
                onClick={handleClick}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
            />

            {requiresExpansion && !isExpanded && (
                <div
                    className="inline-block text-theme-link cursor-pointer text-[11px] font-bold mt-[8px] hover:underline"
                    onClick={() => setIsExpanded(true)}
                >
                    {t('action.show_more')}
                </div>
            )}

            {tooltipData && (
                <div ref={tooltipRef}>
                    <StickerTooltip
                        info={tooltipData.info}
                        samples={tooltipData.samples}
                        isLoading={isLoadingTooltip}
                        position={tooltipData.position}
                        onMouseLeave={() => setTooltipData(null)}
                        onInstall={() => handleInstallPack(tooltipData.info?.short_name || tooltipData.packName)}
                    />
                </div>
            )}

            {mentionTooltip && (
                <div
                    className="fixed z-[99999] w-[250px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                    style={{ top: mentionTooltip.position.y, left: mentionTooltip.position.x }}
                    onMouseEnter={() => {
                        if (mentionCloseTimerRef.current) clearTimeout(mentionCloseTimerRef.current);
                    }}
                    onMouseLeave={scheduleMentionClose}
                >
                    {mentionTooltip.isLoading ? (
                        <div className="bg-bg-box border border-border p-[8px] text-[10px] text-text-muted italic text-center">
                            {t('common.loading')}
                        </div>
                    ) : mentionTooltip.user ? (
                        <UserMiniCard user={mentionTooltip.user} />
                    ) : mentionTooltip.notFound ? (
                        <div className="bg-bg-box border border-border p-[8px] text-[10px] text-text-muted italic text-center">
                            {t('editor.mention_not_found')}
                        </div>
                    ) : null}
                </div>
            )}
        </>
    );
});

export default RichText;