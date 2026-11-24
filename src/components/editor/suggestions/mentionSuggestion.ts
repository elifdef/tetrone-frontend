import { ReactRenderer } from '@tiptap/react';
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import MentionList, { type MentionListHandle, type MentionListProps } from '../MentionList';
import userService from '@services/user.service';
import type { MentionNodeAttrs } from '@/types/tiptap';
import type { UserData } from '@/types/user';

let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

const mentionSuggestion: Omit<SuggestionOptions<UserData, MentionNodeAttrs>, 'editor'> = {
    char: '@',

    command: ({ editor, range, props }) => {
        const nodeAfter = editor.view.state.doc.nodeAt(range.to);
        const overrideSpace = nodeAfter?.text?.startsWith(' ');

        const targetRange = {
            from: range.from,
            to: overrideSpace ? range.to + 1 : range.to,
        };

        editor
            .chain()
            .focus()
            .insertContentAt(targetRange, [
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

    items: ({ query }): Promise<UserData[]> => {
        return new Promise((resolve) => {
            if (debounceTimeout) clearTimeout(debounceTimeout);

            const trimmedQuery = (query || '').trim();
            if (trimmedQuery.length < 2) {
                resolve([]);
                return;
            }

            debounceTimeout = setTimeout(() => {
                userService
                    .searchUsers(trimmedQuery)
                    .onSuccess((res) => {
                        const usersField = res?.users as UserData[] | { data?: UserData[] } | undefined;
                        const rawUsers = Array.isArray(usersField)
                            ? usersField
                            : Array.isArray(usersField?.data)
                              ? usersField.data
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
        let component: ReactRenderer<MentionListHandle, MentionListProps> | null = null;
        let popup: TippyInstance[] | null = null;

        return {
            onStart: (props: SuggestionProps<UserData, MentionNodeAttrs>) => {
                const renderer = new ReactRenderer<MentionListHandle, MentionListProps>(MentionList, {
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

            onUpdate(props: SuggestionProps<UserData, MentionNodeAttrs>) {
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
                popup?.[0]?.destroy();
                component?.destroy();
            },
        };
    },
};

export default mentionSuggestion;