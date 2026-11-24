import { describe, expect, it } from 'vitest';
import {
    ALLOWED_FONTS,
    ALLOWED_FONT_SIZES,
    getPresetConfig,
    getTipTapTextLength,
    hasEditorFeature,
    isTipTapDocEmpty,
    sanitizeTipTapDoc,
    validateTipTapDoc,
} from './presets';
import type { EditorFormatFeature, TipTapDoc } from '@/types/tiptap';

/**
 * Повний реальний документ поста з усіма варіантами блоків, вирівнювання,
 * заголовків, списків, чекбоксів, цитат, коду, спойлерів, таблиць та стилів.
 */
export const FULL_POST_FIXTURE: TipTapDoc = {
    type: 'doc',
    content: [
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: 'left' }, content: [{ type: 'text', text: 'Привет' }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: 'center' }, content: [{ type: 'text', text: 'Привет' }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: 'right' }, content: [{ type: 'text', text: 'Привет' }] },
        { type: 'heading', attrs: { id: 'block-7hda52sr0', level: 1, textAlign: null }, content: [{ type: 'text', text: 'Привет' }] },
        { type: 'heading', attrs: { id: 'block-7hda52sr0', level: 2, textAlign: null }, content: [{ type: 'text', text: 'Привет' }] },
        { type: 'heading', attrs: { id: 'block-7hda52sr0', level: 3, textAlign: null }, content: [{ type: 'text', text: 'Привет' }] },
        { type: 'horizontalRule' },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет' }] },
        {
            type: 'bulletList',
            attrs: { id: 'block-px8cp2miy' },
            content: [
                {
                    type: 'listItem',
                    attrs: { id: 'block-bbrs3pe19' },
                    content: [{ type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет' }] }],
                },
            ],
        },
        {
            type: 'orderedList',
            attrs: { id: 'block-o0h3ew9jg' },
            content: [
                {
                    type: 'listItem',
                    attrs: { id: 'block-qdwxffdi3' },
                    content: [{ type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет' }] }],
                },
            ],
        },
        {
            type: 'taskList',
            content: [
                {
                    type: 'taskItem',
                    attrs: { checked: false },
                    content: [{ type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет' }] }],
                },
            ],
        },
        {
            type: 'blockquote',
            attrs: { id: 'block-f58twfz5m' },
            content: [{ type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет' }] }],
        },
        {
            type: 'pullquote',
            attrs: { color: null },
            content: [{ type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет' }] }],
        },
        {
            type: 'codeBlock',
            attrs: { id: 'block-7hda52sr0', language: null },
            content: [{ type: 'text', text: 'print(&quot;Hello world&quot;)' }],
        },
        {
            type: 'details',
            attrs: { open: true },
            content: [
                { type: 'summary', content: [{ type: 'text', text: 'Hello' }] },
                { type: 'paragraph', attrs: { id: 'block-21itn7j7e', textAlign: null }, content: [{ type: 'text', text: 'Hiiiii' }] },
            ],
        },
        {
            type: 'table',
            content: [
                {
                    type: 'tableRow',
                    content: [
                        {
                            type: 'tableHeader',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-2nx2xz4wr', textAlign: null }, content: [{ type: 'text', text: 'привет 1' }] }],
                        },
                        {
                            type: 'tableHeader',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-21fiogbz6', textAlign: null }, content: [{ type: 'text', text: 'привет 2' }] }],
                        },
                        {
                            type: 'tableHeader',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-o5p1galt9', textAlign: null }, content: [{ type: 'text', text: 'привет 3' }] }],
                        },
                    ],
                },
                {
                    type: 'tableRow',
                    content: [
                        {
                            type: 'tableCell',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-9t58vpj3w', textAlign: null }, content: [{ type: 'text', text: 'привет 4' }] }],
                        },
                        {
                            type: 'tableCell',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-kr9y3u8b6', textAlign: null }, content: [{ type: 'text', text: 'привет 5' }] }],
                        },
                        {
                            type: 'tableCell',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-5lrjpjnkx', textAlign: null }, content: [{ type: 'text', text: 'привет 6' }] }],
                        },
                    ],
                },
                {
                    type: 'tableRow',
                    content: [
                        {
                            type: 'tableCell',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-k7n780pir', textAlign: null }, content: [{ type: 'text', text: 'привет 7' }] }],
                        },
                        {
                            type: 'tableCell',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-d9tcmyrqc', textAlign: null }, content: [{ type: 'text', text: 'привет 8' }] }],
                        },
                        {
                            type: 'tableCell',
                            attrs: { align: null, colspan: 1, rowspan: 1, colwidth: null },
                            content: [{ type: 'paragraph', attrs: { id: 'block-ti2k76yvz', textAlign: null }, content: [{ type: 'text', text: 'привет 9' }] }],
                        },
                    ],
                },
            ],
        },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'bold' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'italic' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'underline' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'strike' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'subscript' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'superscript' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'highlight' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'spoiler' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null }, content: [{ type: 'text', text: 'Привет', marks: [{ type: 'link' }] }] },
        { type: 'paragraph', attrs: { id: 'block-7hda52sr0', textAlign: null } },
        {
            type: 'paragraph',
            attrs: { id: 'block-7hda52sr0', textAlign: null },
            content: [{ type: 'text', text: 'Привет', marks: [{ type: 'textStyle', attrs: { color: '#f5c211' } }] }],
        },
        {
            type: 'paragraph',
            attrs: { id: 'block-7hda52sr0', textAlign: null },
            content: [{ type: 'text', text: 'Привет', marks: [{ type: 'highlight', attrs: { color: '#613583' } }] }],
        },
        {
            type: 'paragraph',
            attrs: { id: 'block-7hda52sr0', textAlign: null },
            content: [{ type: 'text', text: 'Привет', marks: [{ type: 'textStyle', attrs: { fontFamily: 'Times New Roman' } }] }],
        },
        {
            type: 'paragraph',
            attrs: { id: 'block-7hda52sr0', textAlign: null },
            content: [{ type: 'text', text: 'Привет', marks: [{ type: 'textStyle', attrs: { fontSize: '16px' } }] }],
        },
        { type: 'hardBreak' },
    ],
};

describe('TipTap presets & strict validation', () => {
    it('validates the full post fixture with all nodes and marks under post preset', () => {
        const result = validateTipTapDoc(FULL_POST_FIXTURE, 'post');
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.textLength).toBeGreaterThan(150);
    });

    it('enforces strict feature matrices across bio, comment, message, and post presets', () => {
        const allFeatures: EditorFormatFeature[] = [
            'bold',
            'italic',
            'underline',
            'strike',
            'code',
            'subscript',
            'superscript',
            'highlight',
            'spoiler',
            'link',
            'hashtag',
            'color',
            'fontFamily',
            'fontSize',
            'textAlign',
            'heading1',
            'heading2',
            'heading3',
            'horizontalRule',
            'bulletList',
            'orderedList',
            'taskList',
            'blockquote',
            'pullquote',
            'codeBlock',
            'details',
            'table',
            'mention',
            'sticker',
        ];

        // Post allows all 29 features
        for (const f of allFeatures) {
            expect(hasEditorFeature('post', f)).toBe(true);
        }

        // Bio allows ONLY bold, italic, mention, sticker
        const bioAllowed: EditorFormatFeature[] = ['bold', 'italic', 'mention', 'sticker'];
        for (const f of allFeatures) {
            expect(hasEditorFeature('bio', f)).toBe(bioAllowed.includes(f));
        }

        // Comment allows ONLY bold, italic, underline, strike, spoiler, mention, sticker
        const commentAllowed: EditorFormatFeature[] = [
            'bold',
            'italic',
            'underline',
            'strike',
            'spoiler',
            'mention',
            'sticker',
        ];
        for (const f of allFeatures) {
            expect(hasEditorFeature('comment', f)).toBe(commentAllowed.includes(f));
        }

        // Message allows lists, tables, codeBlock, blockquote, hr, link, highlight, textStyle, basic inline
        expect(hasEditorFeature('message', 'table')).toBe(true);
        expect(hasEditorFeature('message', 'codeBlock')).toBe(true);
        expect(hasEditorFeature('message', 'bulletList')).toBe(true);
        expect(hasEditorFeature('message', 'link')).toBe(true);
        expect(hasEditorFeature('message', 'heading1')).toBe(false);
        expect(hasEditorFeature('message', 'taskList')).toBe(false);
        expect(hasEditorFeature('message', 'pullquote')).toBe(false);
        expect(hasEditorFeature('message', 'details')).toBe(false);
        expect(hasEditorFeature('message', 'textAlign')).toBe(false);
    });

    it('rejects tables, headings, links, underline, and codeBlocks in bio preset', () => {
        const result = validateTipTapDoc(FULL_POST_FIXTURE, 'bio');
        expect(result.valid).toBe(false);

        const disallowedNodes = result.errors
            .filter((e) => e.code === 'DISALLOWED_NODE')
            .map((e) => e.detail);
        expect(disallowedNodes).toEqual(
            expect.arrayContaining([
                'heading',
                'horizontalRule',
                'bulletList',
                'orderedList',
                'taskList',
                'blockquote',
                'pullquote',
                'codeBlock',
                'details',
                'table',
            ])
        );

        const disallowedMarks = result.errors
            .filter((e) => e.code === 'DISALLOWED_MARK')
            .map((e) => e.detail);
        expect(disallowedMarks).toEqual(
            expect.arrayContaining([
                'underline',
                'strike',
                'subscript',
                'superscript',
                'highlight',
                'spoiler',
                'link',
                'textStyle',
            ])
        );
    });

    it('sanitizes full post down to valid bio content when bio preset is applied', () => {
        const sanitizedForBio = sanitizeTipTapDoc(FULL_POST_FIXTURE, 'bio');
        const revalidated = validateTipTapDoc(sanitizedForBio, 'bio');
        expect(revalidated.valid).toBe(true);
        expect(sanitizedForBio.content.some((n) => n.type === 'table')).toBe(false);
        expect(sanitizedForBio.content.some((n) => n.type === 'codeBlock')).toBe(false);
    });

    it('validates comment preset rules (allows spoiler/underline/strike, rejects link/table)', () => {
        const validComment: TipTapDoc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Bold ', marks: [{ type: 'bold' }] },
                        { type: 'text', text: 'Spoiler', marks: [{ type: 'spoiler' }] },
                        { type: 'mention', attrs: { id: 'elifdef', label: 'elifdef' } },
                        {
                            type: 'customSticker',
                            attrs: { id: 1, shortcode: 'wave', src: '/storage/emojis/pack/wave.webp', packName: 'pack' },
                        },
                    ],
                },
            ],
        };
        expect(validateTipTapDoc(validComment, 'comment').valid).toBe(true);

        const commentWithLink: TipTapDoc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Spam', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }],
                },
            ],
        };
        const res = validateTipTapDoc(commentWithLink, 'comment');
        expect(res.valid).toBe(false);
        expect(res.errors[0]).toMatchObject({ code: 'DISALLOWED_MARK', detail: 'link' });
    });

    it('blocks dangerous URLs, invalid fonts/sizes/colors, and disallowed nesting', () => {
        const xssDoc: TipTapDoc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    attrs: { textAlign: 'evil' as never },
                    content: [
                        {
                            type: 'text',
                            text: 'XSS',
                            marks: [
                                { type: 'link', attrs: { href: 'javascript:alert(1)' } },
                                {
                                    type: 'textStyle',
                                    attrs: {
                                        fontFamily: 'ComicHacker',
                                        fontSize: '999px',
                                        color: 'expression(alert(1))',
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'table',
                    content: [
                        {
                            type: 'tableRow',
                            content: [
                                {
                                    type: 'tableCell',
                                    content: [
                                        {
                                            type: 'table',
                                            content: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const validation = validateTipTapDoc(xssDoc, 'post');
        expect(validation.valid).toBe(false);
        expect(validation.errors.some((e) => e.code === 'DISALLOWED_NESTING' && e.detail === 'table')).toBe(true);
        expect(validation.errors.some((e) => e.path.endsWith('href'))).toBe(true);
        expect(validation.errors.some((e) => e.path.endsWith('fontFamily'))).toBe(true);
        expect(validation.errors.some((e) => e.path.endsWith('fontSize'))).toBe(true);
        expect(validation.errors.some((e) => e.path.endsWith('color'))).toBe(true);

        const sanitized = sanitizeTipTapDoc(xssDoc, 'post');
        expect(validateTipTapDoc(sanitized, 'post').valid).toBe(true);
    });

    it('validates all allowed fonts and font sizes', () => {
        for (const fontFamily of ALLOWED_FONTS) {
            for (const fontSize of ALLOWED_FONT_SIZES) {
                const doc: TipTapDoc = {
                    type: 'doc',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Sample',
                                    marks: [{ type: 'textStyle', attrs: { fontFamily, fontSize, color: '#123abc' } }],
                                },
                            ],
                        },
                    ],
                };
                expect(validateTipTapDoc(doc, 'post').valid).toBe(true);
            }
        }
    });

    it('enforces maxLength per preset and detects empty documents accurately', () => {
        expect(getPresetConfig('bio').maxLength).toBe(1000);
        expect(getPresetConfig('comment').maxLength).toBe(2000);
        expect(getPresetConfig('message').maxLength).toBe(4000);
        expect(getPresetConfig('post').maxLength).toBe(15000);

        const overBioLimit: TipTapDoc = {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a'.repeat(1001) }] }],
        };
        expect(getTipTapTextLength(overBioLimit)).toBe(1001);
        expect(validateTipTapDoc(overBioLimit, 'bio').errors.some((e) => e.code === 'TEXT_TOO_LONG')).toBe(true);
        expect(validateTipTapDoc(overBioLimit, 'post').valid).toBe(true);

        expect(isTipTapDocEmpty({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true);
        expect(
            isTipTapDocEmpty({
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'customSticker', attrs: { shortcode: 'cat', src: '/cat.png', packName: 'cats' } }],
                    },
                ],
            })
        ).toBe(false);
    });
});