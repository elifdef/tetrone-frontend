import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const UniqueId = Extension.create({
    name: 'uniqueId',

    addGlobalAttributes() {
        return [
            {
                // Додаємо ID тільки до блокових елементів
                types: ['heading', 'paragraph', 'blockquote', 'codeBlock', 'orderedList', 'bulletList', 'listItem'],
                attributes: {
                    id: {
                        default: null,
                        parseHTML: element => element.getAttribute('id'),
                        renderHTML: attributes => {
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
                appendTransaction: (transactions, oldState, newState) => {
                    const tr = newState.tr;
                    let modified = false;

                    if (transactions.some(transaction => transaction.docChanged)) {
                        newState.doc.descendants((node, pos) => {
                            if (node.isBlock && !node.attrs.id && this.options.types.includes(node.type.name)) {
                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    id: 'block-' + Math.random().toString(36).substr(2, 9)
                                });
                                modified = true;
                            }
                        });
                    }
                    return modified ? tr : null;
                }
            })
        ];
    }
});