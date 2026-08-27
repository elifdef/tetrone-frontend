import { Node, Extension, Mark, mergeAttributes } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export const SpoilerMark = Mark.create({
    name: 'spoiler',
    parseHTML() { return [{ tag: 'span[data-spoiler]' }]; },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-spoiler': 'true', class: 'spoiler-inline' }), 0];
    },
    addCommands() { return { toggleSpoiler: () => ({ commands }) => commands.toggleMark(this.name) }; },
});

const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px'];

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
    parseHTML() { return [{ tag: 'div.pullquote' }]; },
    renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { class: 'pullquote' }), 0]; },
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
    addAttributes() {
        return {
            open: {
                default: true,
                parseHTML: element => element.hasAttribute('open'),
                renderHTML: attributes => attributes.open ? { open: 'open' } : {},
            }
        }
    },
    parseHTML() { return [{ tag: 'details.post-details' }, { tag: 'details' }]; },
    // Для готового поста рендеримо нативний тег <details>
    renderHTML({ HTMLAttributes }) { return ['details', mergeAttributes(HTMLAttributes, { class: 'post-details' }), 0]; },

    // Для редактора рендеримо <div>, щоб вбити баги браузера!
    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement('div');
            dom.classList.add('post-details');

            if (node.attrs.open) {
                dom.setAttribute('open', '');
            }

            return {
                dom,
                contentDOM: dom,
                update: (updatedNode) => {
                    if (updatedNode.type.name !== 'details') return false;
                    if (updatedNode.attrs.open) {
                        dom.setAttribute('open', '');
                    } else {
                        dom.removeAttribute('open');
                    }
                    return true;
                }
            };
        };
    },

    addCommands() {
        return {
            setDetails: (summaryText = 'Заголовок...', bodyText = 'Текст...') => ({ commands }) => {
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
    isolating: true,
    parseHTML() { return [{ tag: 'summary' }]; },

    // В готовий пост виводимо <summary>
    renderHTML({ HTMLAttributes }) {
        return [
            'summary',
            HTMLAttributes,
            ['span', { class: 'post-details-toggle', contenteditable: 'false' }],
            ['span', { class: 'post-details-summary-content' }, 0]
        ];
    },

    // В редакторі виводимо <div>
    addNodeView() {
        return ({ editor, getPos }) => {
            const dom = document.createElement('div');
            dom.classList.add('post-details-summary');

            const toggle = document.createElement('span');
            toggle.classList.add('post-details-toggle');
            toggle.contentEditable = 'false';

            const contentDOM = document.createElement('span');
            contentDOM.classList.add('post-details-summary-content');

            dom.appendChild(toggle);
            dom.appendChild(contentDOM);

            // Клік по трикутнику (мишкою/дотиком) = зміна стану open
            toggle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!editor.isEditable) return;
                if (typeof getPos !== 'function') return;

                const summaryPos = getPos();
                if (typeof summaryPos !== 'number') return;

                const $pos = editor.state.doc.resolve(summaryPos);
                const detailsPos = $pos.before();
                const detailsNode = editor.state.doc.nodeAt(detailsPos);

                if (detailsNode && detailsNode.type.name === 'details') {
                    editor.view.dispatch(
                        editor.state.tr.setNodeMarkup(detailsPos, null, {
                            ...detailsNode.attrs,
                            open: !detailsNode.attrs.open,
                        })
                    );
                }
            });

            return { dom, contentDOM };
        };
    },

    addKeyboardShortcuts() {
        return {
            'Enter': () => {
                if (this.editor.isActive('summary')) {
                    return this.editor.commands.setHardBreak();
                }
                return false;
            }
        };
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