import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SmartEditor from './SmartEditor';
import RichText from '../common/RichText';
import StickerService from '../../services/sticker.service';
import { FULL_POST_FIXTURE } from './presets.test';
import { validateTipTapDoc } from './presets';
import type { TipTapDoc } from '@/types/tiptap';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../../services/sticker.service', () => ({
    default: {
        getMyPacks: vi.fn(() => ({
            onSuccess: (cb: (res: { packs: unknown[] }) => void) => {
                cb({ packs: [] });
                return { onError: () => {} };
            },
        })),
        getStickerInfo: vi.fn(() => ({
            onSuccess: (cb: (res: { pack: Record<string, unknown>; samples: unknown[] }) => void) => {
                cb({
                    pack: { short_name: 'furina_de_fontaine', title: 'Furina', is_installed: false },
                    samples: [],
                });
                return { onError: () => {} };
            },
        })),
        installPack: vi.fn(),
    },
}));

describe('SmartEditor & RichText full formatting integration', () => {
    it('renders every block, inline mark, and customSticker from the full post fixture in RichText', () => {
        const { container } = render(
            <MemoryRouter>
                <RichText text={FULL_POST_FIXTURE} limit={10000} />
            </MemoryRouter>
        );

        // Alignments
        expect(container.querySelector('p[style*="text-align: left"]')).not.toBeNull();
        expect(container.querySelector('p[style*="text-align: center"]')).not.toBeNull();
        expect(container.querySelector('p[style*="text-align: right"]')).not.toBeNull();

        // Headings & HR
        expect(container.querySelector('h1')?.textContent).toBe('Привет');
        expect(container.querySelector('h2')?.textContent).toBe('Привет');
        expect(container.querySelector('h3')?.textContent).toBe('Привет');
        expect(container.querySelector('hr')).not.toBeNull();

        // Lists & TaskList
        expect(container.querySelector('ul li')?.textContent).toContain('Привет');
        expect(container.querySelector('ol li')?.textContent).toContain('Привет');
        expect(container.querySelector('ul[data-type="taskList"] li[data-checked="false"]')).not.toBeNull();

        // Quotes & Pullquote
        expect(container.querySelector('blockquote')?.textContent).toContain('Привет');
        expect(container.querySelector('div.pullquote')?.textContent).toContain('Привет');

        // CodeBlock with decoded entities
        const codeEl = container.querySelector('pre code');
        expect(codeEl).not.toBeNull();
        expect(codeEl?.textContent).toContain('print("Hello world")');

        // Collapsible details/summary
        const detailsEl = container.querySelector('details.post-details');
        expect(detailsEl).not.toBeNull();
        expect(detailsEl?.querySelector('summary')?.textContent).toContain('Hello');
        expect(detailsEl?.textContent).toContain('Hiiiii');

        // Table headers & cells
        expect(container.querySelectorAll('table th')).toHaveLength(3);
        expect(container.querySelectorAll('table td')).toHaveLength(6);
        expect(container.textContent).toContain('привет 1');
        expect(container.textContent).toContain('привет 9');

        // Inline marks
        expect(container.querySelector('strong')?.textContent).toBe('Привет');
        expect(container.querySelector('em')?.textContent).toBe('Привет');
        expect(container.querySelector('u')?.textContent).toBe('Привет');
        expect(container.querySelector('s')?.textContent).toBe('Привет');
        expect(container.querySelector('sub')?.textContent).toBe('Привет');
        expect(container.querySelector('sup')?.textContent).toBe('Привет');
        expect(container.querySelector('mark')?.textContent).toBe('Привет');
        expect(container.querySelector('span[data-spoiler="true"]')?.textContent).toBe('Привет');
        expect(container.querySelector('a')?.textContent).toBe('Привет');
        expect(container.querySelector('span[style*="Times New Roman"]')).not.toBeNull();
        expect(container.querySelector('span[style*="font-size: 16px"]')).not.toBeNull();
        expect(container.querySelector('br')).not.toBeNull();

        // CustomSticker with packName extracted from src
        const stickerImg = container.querySelector('img.micro-sticker');
        expect(stickerImg).not.toBeNull();
        expect(stickerImg?.getAttribute('src')).toBe(
            '/storage/emojis/furina_de_fontaine/sticker-1795518900-25fc0de68dfba850.webp'
        );
        expect(stickerImg?.getAttribute('alt')).toBe(':sticker_30:');
        expect(stickerImg?.getAttribute('data-shortcode')).toBe('sticker_30');
        expect(stickerImg?.getAttribute('data-pack-name')).toBe('furina_de_fontaine');

        fireEvent.click(stickerImg!);
        expect(StickerService.getStickerInfo).toHaveBeenCalledWith('furina_de_fontaine');
    });

    it('exposes ONLY bold and italic in FloatingFormatMenu when preset="bio"', () => {
        render(<SmartEditor preset="bio" placeholder="Bio..." />);

        fireEvent.click(screen.getByTitle('editor.format_text'));

        expect(screen.getByTitle('editor.bold')).toBeInTheDocument();
        expect(screen.getByTitle('editor.italic')).toBeInTheDocument();

        expect(screen.queryByTitle('editor.underline')).toBeNull();
        expect(screen.queryByTitle('editor.strike')).toBeNull();
        expect(screen.queryByTitle('editor.link')).toBeNull();
        expect(screen.queryByTitle('editor.spoiler')).toBeNull();
        expect(screen.queryByText('editor.category_tables')).toBeNull();
        expect(screen.queryByText('editor.category_headers')).toBeNull();
        expect(screen.queryByText('editor.category_lists')).toBeNull();
        expect(screen.queryByText('editor.category_blocks')).toBeNull();
    });

    it('exposes comment-specific tools in FloatingFormatMenu when preset="comment"', () => {
        render(<SmartEditor preset="comment" placeholder="Comment..." />);

        fireEvent.click(screen.getByTitle('editor.format_text'));

        expect(screen.getByTitle('editor.bold')).toBeInTheDocument();
        expect(screen.getByTitle('editor.italic')).toBeInTheDocument();
        expect(screen.getByTitle('editor.underline')).toBeInTheDocument();
        expect(screen.getByTitle('editor.strike')).toBeInTheDocument();
        expect(screen.getByTitle('editor.spoiler')).toBeInTheDocument();

        expect(screen.queryByTitle('editor.link')).toBeNull();
        expect(screen.queryByText('editor.category_tables')).toBeNull();
        expect(screen.queryByText('editor.category_headers')).toBeNull();
        expect(screen.queryByText('editor.category_lists')).toBeNull();
    });

    it('exposes message-specific tools (tables, code, lists, quotes, link) without headings/details in preset="message"', () => {
        render(<SmartEditor preset="message" placeholder="Message..." />);

        fireEvent.click(screen.getByTitle('editor.format_text'));

        expect(screen.getByTitle('editor.bold')).toBeInTheDocument();
        expect(screen.getByTitle('editor.link')).toBeInTheDocument();
        expect(screen.getByText('editor.category_tables')).toBeInTheDocument();
        expect(screen.getByText('editor.category_lists')).toBeInTheDocument();
        expect(screen.getByText('editor.category_blocks')).toBeInTheDocument();

        expect(screen.queryByText('editor.category_headers')).toBeNull();
        expect(screen.queryByText('editor.task_list')).toBeNull();
        expect(screen.queryByText('editor.pullquote')).toBeNull();
        expect(screen.queryByText('editor.collapsible_block')).toBeNull();
    });

    it('supports all formatting actions in preset="post" and produces valid TipTap JSON', () => {
        let latestDoc: TipTapDoc | null = null;
        render(
            <SmartEditor
                preset="post"
                placeholder="Write post..."
                onChange={(doc) => {
                    latestDoc = doc;
                }}
            />
        );

        fireEvent.click(screen.getByTitle('editor.format_text'));

        // Insert table, heading, code block, details
        fireEvent.click(screen.getByText('editor.insert_table'));
        expect(latestDoc).not.toBeNull();
        expect(validateTipTapDoc(latestDoc, 'post').valid).toBe(true);
        expect(JSON.stringify(latestDoc)).toContain('"type":"table"');

        fireEvent.click(screen.getByText('editor.collapsible_block'));
        expect(validateTipTapDoc(latestDoc, 'post').valid).toBe(true);
        expect(JSON.stringify(latestDoc)).toContain('"type":"details"');
    });
});