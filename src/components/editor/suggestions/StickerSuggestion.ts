import { ReactRenderer } from '@tiptap/react';
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import SuggestionList, {
    type StickerSuggestionItem,
    type SuggestionListHandle,
    type SuggestionListProps,
} from '../SuggestionList';
import StickerService from '@services/sticker.service';

interface RawStickerPack {
    short_name?: string;
    stickers?: Array<{
        id: number | string;
        shortcode: string;
        url?: string;
        src?: string;
        keywords?: string;
    }>;
}

let cachedStickers: StickerSuggestionItem[] | null = null;

const stickerSuggestion: Omit<SuggestionOptions<StickerSuggestionItem, StickerSuggestionItem>, 'editor'> = {
    char: ':',
    allowSpaces: true,

    findSuggestionMatch(config) {
        const { $position } = config;
        if (!$position || !$position.parent) return null;

        const text = $position.parent.textBetween(
            Math.max(0, $position.parentOffset - 40),
            $position.parentOffset,
            null,
            '\ufffc'
        );

        const regexp = /(?:^|\s):([a-zA-Z0-9_\s]{1,30})$/;
        const match = regexp.exec(text);

        if (!match) return null;

        const matchText = match[0].replace(/^\s+/, '');
        const from = $position.pos - matchText.length;
        const to = $position.pos;

        return {
            range: { from, to },
            query: match[1],
            text: matchText,
        };
    },

    command: ({ editor, range, props }) => {
        editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
                type: 'customSticker',
                attrs: {
                    id: props.id,
                    shortcode: props.shortcode,
                    src: props.url || props.src || null,
                    packName: props.pack_short_name || props.packName || null,
                },
            })
            .insertContent(' ')
            .run();
    },

    async items({ query }): Promise<StickerSuggestionItem[]> {
        if (query.length < 1) return [];

        if (!cachedStickers || cachedStickers.length === 0) {
            await new Promise<void>((resolve) => {
                StickerService.getMyPacks()
                    .onSuccess((res) => {
                        const packs = (res.packs || res.data || []) as RawStickerPack[];
                        if (Array.isArray(packs)) {
                            cachedStickers = packs.flatMap((pack) => {
                                if (!Array.isArray(pack.stickers)) return [];
                                return pack.stickers.map((sticker) => ({
                                    ...sticker,
                                    url: sticker.url || sticker.src || '',
                                    pack_short_name: pack.short_name,
                                }));
                            });
                        } else {
                            cachedStickers = [];
                        }
                        resolve();
                    })
                    .onError((err) => {
                        console.error('Помилка завантаження кешу:', err);
                        cachedStickers = [];
                        resolve();
                    });
            });
        }

        const normQuery = query.toLowerCase().trim().replace(/_/g, ' ');
        return (cachedStickers || [])
            .filter((sticker) => {
                if (!sticker || !sticker.shortcode) return false;
                const normShortcode = sticker.shortcode.toLowerCase().replace(/_/g, ' ');
                const normKeywords = (sticker.keywords || '').toLowerCase().replace(/_/g, ' ');
                return normShortcode.includes(normQuery) || normKeywords.includes(normQuery);
            })
            .slice(0, 20);
    },

    render: () => {
        let component: ReactRenderer<SuggestionListHandle, SuggestionListProps> | null = null;
        let popup: TippyInstance[] | null = null;

        return {
            onStart: (props: SuggestionProps<StickerSuggestionItem, StickerSuggestionItem>) => {
                const renderer = new ReactRenderer<SuggestionListHandle, SuggestionListProps>(SuggestionList, {
                    props,
                    editor: props.editor,
                });
                component = renderer;

                if (!props.clientRect) return;

                popup = tippy('body', {
                    getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
                    appendTo: () => document.body,
                    content: renderer.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: SuggestionProps<StickerSuggestionItem, StickerSuggestionItem>) {
                component?.updateProps(props);

                if (!props.clientRect || !popup?.[0]) return;
                popup[0].setProps({
                    getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
                });
            },

            onKeyDown(props: SuggestionKeyDownProps) {
                if (props.event.key === 'Escape') {
                    popup?.[0]?.hide();
                    return true;
                }
                return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit() {
                if (popup?.[0]) {
                    popup[0].destroy();
                    popup = null;
                }
                if (component) {
                    component.destroy();
                    component = null;
                }
            },
        };
    },
};

export default stickerSuggestion;