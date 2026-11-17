import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import MentionList from '../MentionList.jsx';
import userService from '@services/user.service.js';

let debounceTimeout;

const mentionSuggestion = {
    char: '@',

    command: ({ editor, range, props }) => {
        const nodeAfter = editor.view.state.doc.nodeAt(range.to);
        const overrideSpace = nodeAfter?.text?.startsWith(' ');

        if (overrideSpace) {
            range.to += 1;
        }

        editor
            .chain()
            .focus()
            .insertContentAt(range, [
                {
                    type: 'mention',
                    attrs: props,
                },
                {
                    type: 'text',
                    text: ' ',
                },
            ])
            .run();

        window.getSelection()?.collapseToEnd();
    },

    items: ({ query }) => {
        return new Promise((resolve) => {
            clearTimeout(debounceTimeout);

            const trimmedQuery = (query || '').trim();
            if (trimmedQuery.length < 2) {
                resolve([]);
                return;
            }

            debounceTimeout = setTimeout(() => {
                userService.searchUsers(trimmedQuery)
                    .onSuccess((res) => {
                        const rawUsers = Array.isArray(res?.users)
                            ? res.users
                            : Array.isArray(res?.users?.data)
                                ? res.users.data
                                : Array.isArray(res?.data)
                                    ? res.data
                                    : [];

                        resolve(rawUsers.slice(0, 5));
                    })
                    .onError(() => {
                        resolve([]);
                    });
            }, 300);
        });
    },

    render: () => {
        let component;
        let popup;

        return {
            onStart: props => {
                component = new ReactRenderer(MentionList, {
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
                if (!props.clientRect || !popup?.[0]) return;
                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props) {
                if (props.event.key === 'Escape') {
                    popup?.[0]?.hide();
                    return true;
                }
                return component?.ref?.onKeyDown(props);
            },

            onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
            },
        };
    },
};

export default mentionSuggestion;