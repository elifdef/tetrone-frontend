import { Node, Extension, Mark, mergeAttributes } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { Plugin } from '@tiptap/pm/state';

export const SpoilerMark = Mark.create({
    name: 'spoiler',
    parseHTML() { return [{ tag: 'span[data-spoiler]' }]; },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-spoiler': 'true', class: 'tetrone-spoiler' }), 0];
    },
    addCommands() { return { toggleSpoiler: () => ({ commands }) => commands.toggleMark(this.name) }; },
});

const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '19px', '20px', '22px', '24px'];

export const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() { return { types: ['textStyle'] }; },
    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                fontSize: {
                    default: null,
                    parseHTML: element => {
                        const size = element.style.fontSize?.replace(/['"]+/g, '');
                        return ALLOWED_FONT_SIZES.includes(size) ? size : null;
                    },
                    renderHTML: attributes => {
                        if (!attributes.fontSize || !ALLOWED_FONT_SIZES.includes(attributes.fontSize)) return {};
                        return { style: `font-size: ${attributes.fontSize}` };
                    },
                },
            },
        }];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                if (!ALLOWED_FONT_SIZES.includes(fontSize) && fontSize !== null) return false;
                return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
        };
    },
});

export const EnterHandler = Extension.create({
    name: 'enterHandler',
    addOptions() { return { onEnterRef: null }; },
    addKeyboardShortcuts() {
        return {
            'Enter': () => {
                const onEnter = this.options.onEnterRef?.current;
                if (onEnter) {
                    onEnter();
                    return true;
                }
                return false;
            },
            'Shift-Enter': () => this.editor.commands.first(({ commands }) => [
                () => commands.newlineInCode(),
                () => commands.createParagraphNear(),
                () => commands.liftEmptyBlock(),
                () => commands.splitBlock(),
            ]),
        };
    }
});

export const PullquoteNode = Node.create({
    name: 'pullquote',
    group: 'block',
    content: 'block+',
    defining: true,
    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: element => element.getAttribute('data-color'),
                renderHTML: attributes => {
                    if (!attributes.color) return {};
                    return {
                        'data-color': attributes.color,
                        style: `--quote-color: ${attributes.color};`
                    };
                },
            }
        }
    },
    parseHTML() { return [{ tag: 'div.tetrone-pullquote' }]; },
    renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { class: 'tetrone-pullquote' }), 0]; },
    addCommands() {
        return {
            togglePullquote: () => ({ commands }) => commands.toggleWrap(this.name),
            setPullquoteColor: (color) => ({ commands }) => commands.updateAttributes(this.name, { color })
        };
    },
});

export const DetailsNode = Node.create({
    name: 'details',
    group: 'block',
    content: 'summary block+',
    defining: true,
    isolating: true,
    addAttributes() {
        return {
            open: {
                default: true,
                parseHTML: element => element.hasAttribute('open'),
                renderHTML: attributes => attributes.open ? { open: 'open' } : {},
            }
        }
    },
    parseHTML() { return [{ tag: 'details.tetrone-details' }, { tag: 'details' }]; },
    renderHTML({ HTMLAttributes }) { return ['details', mergeAttributes(HTMLAttributes, { class: 'tetrone-details' }), 0]; },

    // ДОДАЄМО СИНХРОНІЗАЦІЮ СТАНУ
    addNodeView() {
        return ({ node, getPos, editor }) => {
            const dom = document.createElement('details');
            dom.classList.add('tetrone-details');

            // Встановлюємо стан при завантаженні (з JSON)
            if (node.attrs.open) {
                dom.setAttribute('open', '');
            }

            // Слухаємо клік користувача і записуємо зміну в Tiptap
            dom.addEventListener('toggle', () => {
                if (typeof getPos === 'function') {
                    const pos = getPos();
                    const currentState = editor.state.doc.nodeAt(pos)?.attrs?.open;
                    if (currentState !== dom.open) {
                        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, null, { open: dom.open }));
                    }
                }
            });

            return {
                dom,
                contentDOM: dom, // Дозволяємо Tiptap рендерити summary та paragraph всередині
            };
        };
    },

    addCommands() {
        return {
            setDetails: (summaryText = '...', bodyText = '...') => ({ commands }) => {
                return commands.insertContent({
                    type: 'details',
                    attrs: { open: true },
                    content: [
                        { type: 'summary', content: [{ type: 'text', text: summaryText }] },
                        { type: 'paragraph', content: [{ type: 'text', text: bodyText }] }
                    ]
                });
            }
        };
    }
});

export const SummaryNode = Node.create({
    name: 'summary',
    content: 'inline*',
    defining: true,
    isolating: true,
    parseHTML() { return [{ tag: 'summary' }]; },
    renderHTML({ HTMLAttributes }) { return ['summary', HTMLAttributes, 0]; },
    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    handleDOMEvents: {
                        click: (view, event) => {
                            // Перехоплюємо клік на заголовок, щоб браузер не згортав його під час редагування
                            if (event.target.closest('summary')) {
                                event.preventDefault();
                                return false; // Дозволяємо TipTap поставити курсор
                            }
                            return false;
                        }
                    }
                }
            })
        ];
    }
});

export const StickerTrigger = Extension.create({
    name: 'stickerTrigger',
    addOptions() { return { suggestion: {} }; },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});