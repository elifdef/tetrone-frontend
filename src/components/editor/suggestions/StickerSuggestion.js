import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import SuggestionList from '../SuggestionList.jsx';
import StickerService from '../../../services/sticker.service.js';

let cachedStickers = null;

export default {
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
                    src: props.url || props.src,
                    packName: props.pack_short_name || props.packName
                }
            })
            .insertContent(' ')
            .run();
    },

    async items({ query }) {
        if (query.length < 1) return [];

        if (!cachedStickers || cachedStickers.length === 0) {
            await new Promise((resolve) => {
                StickerService.getMyPacks()
                    .onSuccess((res) => {
                        const packs = res.packs || res.data || [];
                        if (Array.isArray(packs)) {
                            cachedStickers = packs.flatMap(pack => {
                                if (!Array.isArray(pack.stickers)) return [];
                                return pack.stickers.map(sticker => ({
                                    ...sticker,
                                    pack_short_name: pack.short_name
                                }));
                            });
                        } else {
                            cachedStickers = [];
                        }
                        resolve();
                    })
                    .onError((err) => {
                        console.error("Помилка завантаження кешу:", err);
                        cachedStickers = [];
                        resolve();
                    });
            });
        }

        const normQuery = query.toLowerCase().trim().replace(/_/g, ' ');
        return cachedStickers.filter(sticker => {
            if (!sticker || !sticker.shortcode) return false;
            const normShortcode = sticker.shortcode.toLowerCase().replace(/_/g, ' ');
            const normKeywords = (sticker.keywords || '').toLowerCase().replace(/_/g, ' ');
            return normShortcode.includes(normQuery) || normKeywords.includes(normQuery);
        }).slice(0, 20);
    },

    render: () => {
        let component;
        let popup;

        return {
            onStart: props => {
                component = new ReactRenderer(SuggestionList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props) {
                component?.updateProps(props);

                if (!props.clientRect || !popup) return;
                popup[0].setProps({ getReferenceClientRect: props.clientRect });
            },

            onKeyDown(props) {
                if (props.event.key === 'Escape') {
                    popup?.[0].hide();
                    return true;
                }
                return component?.ref?.onKeyDown(props);
            },

            onExit() {
                if (popup && popup[0]) {
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