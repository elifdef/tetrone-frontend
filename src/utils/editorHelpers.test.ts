import { describe, expect, it } from 'vitest';
import { extractPreviewText, isEditorEmpty, isOnlyStickers } from './editorHelpers';
import { toRichText } from './toRichText';
import type { TipTapDoc } from '@/types/tiptap';

describe('editorHelpers & toRichText', () => {
    it('detects empty TipTap documents', () => {
        expect(isEditorEmpty(null)).toBe(true);
        expect(isEditorEmpty({ type: 'doc', content: [] })).toBe(true);
        expect(isEditorEmpty({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '   ' }] }] })).toBe(true);
        expect(isEditorEmpty(toRichText('Hello'))).toBe(false);
    });

    it('detects sticker-only documents', () => {
        const stickerDoc: TipTapDoc = {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'customSticker', attrs: { shortcode: 'cat' } }] }],
        };
        expect(isOnlyStickers(stickerDoc)).toBe(true);
        expect(isOnlyStickers(toRichText('text'))).toBe(false);
    });

    it('extracts preview text with sticker shortcodes', () => {
        const doc: TipTapDoc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Hi ' },
                        { type: 'customSticker', attrs: { shortcode: 'wave' } },
                    ],
                },
            ],
        };
        expect(extractPreviewText(doc)).toBe('Hi [wave]');
    });
});