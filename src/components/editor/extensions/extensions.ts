import type { MutableRefObject } from 'react';
import { Node, Extension, Mark, mergeAttributes } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { ALLOWED_FONT_SIZES } from '../presets';
import type { TipTapAllowedFontSize } from '@/types/tiptap';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        spoiler: {
            toggleSpoiler: () => ReturnType;
        };
        fontSize: {
            setFontSize: (fontSize: string | null) => ReturnType;
            unsetFontSize: () => ReturnType;
        };
        pullquote: {
            togglePullquote: () => ReturnType;
            setPullquoteColor: (color: string | null) => ReturnType;
        };
        details: {
            setDetails: (summaryText?: string, bodyText?: string) => ReturnType;
        };
    }
}

export const SpoilerMark = Mark.create({
    name: 'spoiler',
    parseHTML() {
        return [{ tag: 'span[data-spoiler]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-spoiler': 'true', class: 'spoiler-inline' }), 0];
    },
    addCommands() {
        return {
            toggleSpoiler:
                () =>
                ({ commands }) =>
                    commands.toggleMark(this.name),
        };
    },
});

export const FontSize = Extension.create({
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
                        parseHTML: (element: HTMLElement) => {
                            const size = element.style.fontSize?.replace(/['"]+/g, '') as TipTapAllowedFontSize;
                            return ALLOWED_FONT_SIZES.includes(size) ? size : null;
                        },
                        renderHTML: (attributes: Record<string, unknown>) => {
                            const size = attributes.fontSize as TipTapAllowedFontSize | undefined;
                            if (!size || !ALLOWED_FONT_SIZES.includes(size)) return {};
                            return { style: `font-size: ${size}` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize:
                (fontSize) =>
                ({ chain }) => {
                    if (fontSize !== null && !ALLOWED_FONT_SIZES.includes(fontSize as TipTapAllowedFontSize)) {
                        return false;
                    }
                    return chain().setMark('textStyle', { fontSize }).run();
                },
            unsetFontSize:
                () =>
                ({ chain }) =>
                    chain().setMark('textStyle', { fontSize: null }).run(),
        };
    },
});

export interface EnterHandlerOptions {
    onEnterRef: MutableRefObject<(() => void) | null> | null;
}

export const EnterHandler = Extension.create<EnterHandlerOptions>({
    name: 'enterHandler',
    addOptions() {
        return { onEnterRef: null };
    },
    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const onEnter = this.options.onEnterRef?.current;
                if (onEnter) {
                    onEnter();
                    return true;
                }
                return false;
            },
            'Shift-Enter': () =>
                this.editor.commands.first(({ commands }) => [
                    () => commands.newlineInCode(),
                    () => commands.createParagraphNear(),
                    () => commands.liftEmptyBlock(),
                    () => commands.splitBlock(),
                ]),
        };
    },
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
                parseHTML: (element: HTMLElement) => element.getAttribute('data-color'),
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.color) return {};
                    return {
                        'data-color': attributes.color,
                        style: `--quote-color: ${attributes.color};`,
                    };
                },
            },
        };
    },
    parseHTML() {
        return [{ tag: 'div.pullquote' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { class: 'pullquote' }), 0];
    },
    addCommands() {
        return {
            togglePullquote:
                () =>
                ({ commands }) =>
                    commands.toggleWrap(this.name),
            setPullquoteColor:
                (color) =>
                ({ commands }) =>
                    commands.updateAttributes(this.name, { color }),
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
                parseHTML: (element: HTMLElement) => element.hasAttribute('open'),
                renderHTML: (attributes: Record<string, unknown>) => (attributes.open ? { open: 'open' } : {}),
            },
        };
    },
    parseHTML() {
        return [{ tag: 'details.post-details' }, { tag: 'details' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['details', mergeAttributes(HTMLAttributes, { class: 'post-details' }), 0];
    },
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
                },
            };
        };
    },
    addCommands() {
        return {
            setDetails:
                (summaryText = 'Заголовок...', bodyText = 'Текст...') =>
                ({ commands }) =>
                    commands.insertContent({
                        type: 'details',
                        attrs: { open: true },
                        content: [
                            { type: 'summary', content: [{ type: 'text', text: summaryText }] },
                            { type: 'paragraph', content: [{ type: 'text', text: bodyText }] },
                        ],
                    }),
        };
    },
});

export const SummaryNode = Node.create({
    name: 'summary',
    content: 'inline*',
    isolating: true,
    parseHTML() {
        return [{ tag: 'summary' }];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'summary',
            HTMLAttributes,
            ['span', { class: 'post-details-toggle', contenteditable: 'false' }],
            ['span', { class: 'post-details-summary-content' }, 0],
        ];
    },
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
            Enter: () => {
                if (this.editor.isActive('summary')) {
                    return this.editor.commands.setHardBreak();
                }
                return false;
            },
        };
    },
});

export interface StickerTriggerOptions {
    suggestion: Omit<SuggestionOptions, 'editor'>;
}

export const StickerTrigger = Extension.create<StickerTriggerOptions>({
    name: 'stickerTrigger',
    addOptions() {
        return { suggestion: {} };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});