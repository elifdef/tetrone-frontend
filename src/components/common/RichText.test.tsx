import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import RichText from './RichText';
import StickerService from '../../services/sticker.service';
import userService from '../../services/user.service';
import type { TipTapDoc } from '@/types/tiptap';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
    const actual = await vi.importActual<typeof import('react-router')>('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('./UserMiniCard', () => ({
    default: ({ user }: { user: { username?: string; first_name?: string } }) => (
        <div data-testid="user-mini-card">{user.first_name || user.username}</div>
    ),
}));

vi.mock('../editor/StickerTooltip', () => ({
    default: ({
        info,
        onInstall,
    }: {
        info: { title?: string } | null;
        onInstall: () => void;
    }) => (
        <div data-testid="sticker-tooltip">
            <span>{info?.title ?? 'loading'}</span>
            <button type="button" onClick={onInstall}>
                install-pack
            </button>
        </div>
    ),
}));

vi.mock('./Notify', () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
}));

vi.mock('../../services/sticker.service', () => ({
    default: {
        getStickerInfo: vi.fn(() => ({
            onSuccess: (cb: (res: { pack: Record<string, unknown>; samples: unknown[] }) => void) => {
                cb({
                    pack: { short_name: 'furina_de_fontaine', title: 'Furina Pack', is_installed: false },
                    samples: [],
                });
                return { onError: () => {} };
            },
        })),
        installPack: vi.fn(() => ({
            onSuccess: (cb: (res: { code: string }) => void) => {
                cb({ code: 'PACK_INSTALLED' });
                return { onError: () => {} };
            },
        })),
    },
}));

vi.mock('../../services/user.service', () => ({
    default: {
        getUser: vi.fn(() => ({
            onSuccess: (cb: (res: { user: Record<string, unknown> }) => void) => {
                cb({
                    user: { username: 'elifdef', first_name: 'Андрій' },
                });
                return { onError: () => {} };
            },
        })),
    },
}));

describe('RichText component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null for empty or non-object values', () => {
        const { container: nullContainer } = render(
            <MemoryRouter>
                <RichText text={null} />
            </MemoryRouter>
        );
        expect(nullContainer.firstChild).toBeNull();

        const { container: strContainer } = render(
            <MemoryRouter>
                <RichText text="plain string" />
            </MemoryRouter>
        );
        expect(strContainer.firstChild).toBeNull();
    });

    it('parses hashtags into clickable links and ignores hashtags inside regular links', () => {
        const doc: TipTapDoc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Привіт #Україна_2026 та ' },
                        {
                            type: 'text',
                            text: '#not_a_tag',
                            marks: [{ type: 'link', attrs: { href: 'https://example.com#not_a_tag' } }],
                        },
                    ],
                },
            ],
        };

        const { container } = render(
            <MemoryRouter>
                <RichText text={doc} />
            </MemoryRouter>
        );

        const hashtags = container.querySelectorAll('.hashtag-link');
        expect(hashtags).toHaveLength(1);
        expect(hashtags[0].textContent).toBe('#Україна_2026');
        expect(hashtags[0].getAttribute('data-hashtag')).toBe('україна_2026');

        fireEvent.click(hashtags[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/?tab=global&hashtag=україна_2026');
    });

    it('toggles spoiler visibility when clicked', () => {
        const doc: TipTapDoc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Секретний текст', marks: [{ type: 'spoiler' }] }],
                },
            ],
        };

        const { container } = render(
            <MemoryRouter>
                <RichText text={doc} />
            </MemoryRouter>
        );

        const spoiler = container.querySelector('.spoiler-inline');
        expect(spoiler).not.toBeNull();
        expect(spoiler?.classList.contains('revealed')).toBe(false);

        fireEvent.click(spoiler!);
        expect(spoiler?.classList.contains('revealed')).toBe(true);

        fireEvent.click(spoiler!);
        expect(spoiler?.classList.contains('revealed')).toBe(false);
    });

    it('renders code header with copy button and copies decoded code text', () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: { writeText },
        });

        const doc: TipTapDoc = {
            type: 'doc',
            content: [
                {
                    type: 'codeBlock',
                    attrs: { language: 'typescript' },
                    content: [{ type: 'text', text: 'const x = &quot;test&quot;;' }],
                },
            ],
        };

        const { container } = render(
            <MemoryRouter>
                <RichText text={doc} />
            </MemoryRouter>
        );

        const header = container.querySelector('.code-header');
        expect(header).not.toBeNull();
        expect(header?.textContent).toContain('typescript');

        const copyButton = header?.querySelector('button');
        expect(copyButton).not.toBeNull();
        fireEvent.click(copyButton!);
        expect(writeText).toHaveBeenCalledWith('const x = "test";');
    });

    it('handles mention click navigation and hover profile card preview', () => {
        vi.useFakeTimers();
        try {
            const doc: TipTapDoc = {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            { type: 'mention', attrs: { id: 'elifdef', label: 'elifdef' } },
                            { type: 'text', text: 'привіт' },
                        ],
                    },
                ],
            };

            const { container } = render(
                <MemoryRouter>
                    <RichText text={doc} />
                </MemoryRouter>
            );

            // Ensure automatic spacing after mention is inserted
            expect(container.textContent).toContain(' привіт');

            const mentionEl = container.querySelector('.user-mention');
            expect(mentionEl).not.toBeNull();

            fireEvent.mouseOver(mentionEl!);
            act(() => {
                vi.advanceTimersByTime(350);
            });

            expect(userService.getUser).toHaveBeenCalledWith('elifdef');
            expect(screen.getByTestId('user-mini-card')).toHaveTextContent('Андрій');

            fireEvent.click(mentionEl!);
            expect(mockNavigate).toHaveBeenCalledWith('/elifdef');
        } finally {
            vi.useRealTimers();
        }
    });

    it('opens StickerTooltip on customSticker click and installs pack', () => {
        const doc: TipTapDoc = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'customSticker',
                            attrs: {
                                id: 28,
                                src: '/storage/emojis/furina_de_fontaine/sticker-1795518900-25fc0de68dfba850.webp',
                                packName: null,
                                shortcode: 'sticker_30',
                            },
                        },
                    ],
                },
            ],
        };

        const { container } = render(
            <MemoryRouter>
                <RichText text={doc} />
            </MemoryRouter>
        );

        const sticker = container.querySelector('img.micro-sticker');
        expect(sticker).not.toBeNull();

        fireEvent.click(sticker!);
        expect(StickerService.getStickerInfo).toHaveBeenCalledWith('furina_de_fontaine');
        expect(screen.getByTestId('sticker-tooltip')).toHaveTextContent('Furina Pack');

        fireEvent.click(screen.getByText('install-pack'));
        expect(StickerService.installPack).toHaveBeenCalledWith('furina_de_fontaine');

        // Clicking outside closes tooltip
        fireEvent.click(document.body);
        expect(screen.queryByTestId('sticker-tooltip')).toBeNull();
    });

    it('truncates long content by limit and expands when show_more is clicked', () => {
        const longText = 'Слово '.repeat(120);
        const doc: TipTapDoc = {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: longText }] }],
        };

        const { container } = render(
            <MemoryRouter>
                <RichText text={doc} limit={50} />
            </MemoryRouter>
        );

        expect(container.textContent?.length).toBeLessThan(longText.length);
        const showMoreBtn = screen.getByText('action.show_more');
        expect(showMoreBtn).toBeInTheDocument();

        fireEvent.click(showMoreBtn);
        expect(screen.queryByText('action.show_more')).toBeNull();
        expect(container.textContent).toContain(longText.trim());
    });
});