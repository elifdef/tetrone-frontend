import { useMemo, type MutableRefObject } from 'react';
import type { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Highlight } from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';

import { CustomStickerNode } from '../extensions/CustomStickerNode';
import {
    SpoilerMark,
    FontSize,
    EnterHandler,
    PullquoteNode,
    DetailsNode,
    SummaryNode,
    StickerTrigger,
} from '../extensions/extensions';
import { UniqueId } from '../extensions/UniqueId';
import mentionSuggestion from '../suggestions/mentionSuggestion';
import stickerSuggestion from '../suggestions/StickerSuggestion';
import { getPresetConfig } from '../presets';
import type { EditorPresetName, TipTapHeadingLevel } from '@/types/tiptap';

const lowlight = createLowlight(all);

export interface UseEditorExtensionsOptions {
    preset?: EditorPresetName | string;
    placeholder?: string;
    onEnterRef?: MutableRefObject<(() => void) | null> | null;
}

export default function useEditorExtensions({
    preset = 'post',
    placeholder = '',
    onEnterRef = null,
}: UseEditorExtensionsOptions): Extensions {
    return useMemo(() => {
        const config = getPresetConfig(preset);
        const { allowedNodes, allowedMarks, allowedFeatures, maxLength } = config;

        const headingLevels: TipTapHeadingLevel[] = [];
        if (allowedFeatures.has('heading1')) headingLevels.push(1);
        if (allowedFeatures.has('heading2')) headingLevels.push(2);
        if (allowedFeatures.has('heading3')) headingLevels.push(3);

        const extensions: Extensions = [
            StarterKit.configure({
                bold: allowedMarks.has('bold') ? {} : false,
                italic: allowedMarks.has('italic') ? {} : false,
                strike: allowedMarks.has('strike') ? {} : false,
                code: allowedMarks.has('code') ? {} : false,
                heading: headingLevels.length > 0 ? { levels: headingLevels } : false,
                blockquote: allowedNodes.has('blockquote') ? {} : false,
                horizontalRule: allowedNodes.has('horizontalRule') ? {} : false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                codeBlock: false,
                link: false,
                underline: false,
            }),
            Placeholder.configure({ placeholder }),
            EnterHandler.configure({ onEnterRef }),
            CharacterCount.configure({ limit: maxLength }),
            Focus.configure({ className: 'has-focus', mode: 'all' }),
        ];

        if (allowedNodes.has('customSticker')) {
            extensions.push(
                CustomStickerNode.configure(),
                StickerTrigger.configure({ suggestion: stickerSuggestion })
            );
        }

        if (allowedNodes.has('mention')) {
            extensions.push(
                Mention.configure({
                    HTMLAttributes: { class: 'user-mention' },
                    suggestion: mentionSuggestion,
                })
            );
        }

        if (allowedMarks.has('underline')) {
            extensions.push(Underline.configure());
        }

        if (allowedMarks.has('spoiler')) {
            extensions.push(SpoilerMark.configure());
        }

        if (allowedMarks.has('link')) {
            extensions.push(
                Link.configure({
                    openOnClick: false,
                    HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
                })
            );
        }

        if (allowedMarks.has('textStyle')) {
            extensions.push(TextStyle.configure());
            if (allowedFeatures.has('color')) {
                extensions.push(Color.configure());
            }
            if (allowedFeatures.has('fontFamily')) {
                extensions.push(FontFamily.configure());
            }
            if (allowedFeatures.has('fontSize')) {
                extensions.push(FontSize.configure());
            }
        }

        if (allowedMarks.has('highlight')) {
            extensions.push(Highlight.configure({ multicolor: true }));
        }

        if (allowedMarks.has('subscript')) {
            extensions.push(Subscript.configure());
        }

        if (allowedMarks.has('superscript')) {
            extensions.push(Superscript.configure());
        }

        if (allowedNodes.has('bulletList')) {
            extensions.push(BulletList.configure());
        }
        if (allowedNodes.has('orderedList')) {
            extensions.push(OrderedList.configure());
        }
        if (allowedNodes.has('listItem')) {
            extensions.push(ListItem.configure());
        }

        if (allowedNodes.has('taskList') && allowedNodes.has('taskItem')) {
            extensions.push(
                TaskList.configure(),
                TaskItem.configure({ nested: true })
            );
        }

        if (
            allowedNodes.has('table') &&
            allowedNodes.has('tableRow') &&
            allowedNodes.has('tableHeader') &&
            allowedNodes.has('tableCell')
        ) {
            extensions.push(
                Table.configure({ resizable: true }),
                TableRow.configure(),
                TableHeader.configure(),
                TableCell.configure()
            );
        }

        if (allowedNodes.has('pullquote')) {
            extensions.push(PullquoteNode.configure());
        }

        if (allowedNodes.has('details') && allowedNodes.has('summary')) {
            extensions.push(DetailsNode.configure(), SummaryNode.configure());
        }

        if (allowedNodes.has('codeBlock')) {
            extensions.push(CodeBlockLowlight.configure({ lowlight }));
        }

        if (allowedFeatures.has('textAlign')) {
            const alignTypes: string[] = ['paragraph'];
            if (headingLevels.length > 0) alignTypes.unshift('heading');
            extensions.push(TextAlign.configure({ types: alignTypes }));
        }

        const uniqueIdTypes: string[] = ['paragraph'];
        if (headingLevels.length > 0) uniqueIdTypes.push('heading');
        if (allowedNodes.has('blockquote')) uniqueIdTypes.push('blockquote');
        if (allowedNodes.has('codeBlock')) uniqueIdTypes.push('codeBlock');
        if (allowedNodes.has('bulletList')) uniqueIdTypes.push('bulletList');
        if (allowedNodes.has('orderedList')) uniqueIdTypes.push('orderedList');
        if (allowedNodes.has('listItem')) uniqueIdTypes.push('listItem');
        if (allowedNodes.has('taskList')) uniqueIdTypes.push('taskList');
        if (allowedNodes.has('taskItem')) uniqueIdTypes.push('taskItem');

        extensions.push(UniqueId.configure({ types: uniqueIdTypes }));

        return extensions;
    }, [preset, placeholder, onEnterRef]);
}