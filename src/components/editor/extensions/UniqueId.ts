import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface UniqueIdOptions {
    types: string[];
}

export const UniqueId = Extension.create<UniqueIdOptions>({
    name: 'uniqueId',

    addOptions() {
        return {
            types: ['heading', 'paragraph', 'blockquote', 'codeBlock', 'orderedList', 'bulletList', 'listItem'],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    id: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.getAttribute('id'),
                        renderHTML: (attributes: Record<string, unknown>) => {
                            if (!attributes.id) return {};
                            return { id: attributes.id };
                        },
                    },
                },
            },
        ];
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('uniqueId'),
                appendTransaction: (transactions, _oldState, newState) => {
                    const tr = newState.tr;
                    let modified = false;

                    if (transactions.some((transaction) => transaction.docChanged)) {
                        newState.doc.descendants((node, pos) => {
                            if (node.isBlock && !node.attrs.id && this.options.types.includes(node.type.name)) {
                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    id: 'block-' + Math.random().toString(36).slice(2, 11),
                                });
                                modified = true;
                            }
                        });
                    }
                    return modified ? tr : null;
                },
            }),
        ];
    },
});