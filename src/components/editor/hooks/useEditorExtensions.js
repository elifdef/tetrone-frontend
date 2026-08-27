import { useMemo } from 'react';
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

// Кастомні розширення
import { CustomStickerNode } from '../extensions/CustomStickerNode';
import { SpoilerMark, FontSize, EnterHandler, PullquoteNode, DetailsNode, SummaryNode, StickerTrigger } from '../extensions/extensions';

// Саджести
import mentionSuggestion from '../suggestions/mentionSuggestion';
import stickerSuggestion from '../suggestions/StickerSuggestion';

// Нові плагіни
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';
import { UniqueId } from '../extensions/UniqueId';

const lowlight = createLowlight(all);

// preset = 'post' | 'bio' | 'comment'
export default function useEditorExtensions({ preset = 'post', placeholder = '', onEnterRef }) {
    return useMemo(() => {
        // ФІКС: Оголошуємо змінну charLimit ДО того, як її використати
        const charLimit = preset === 'bio' ? 1000 : preset === 'comment' ? 2000 : 15000;

        // Базові плагіни (без StarterKit, щоб не було конфліктів)
        const extensions = [
            Placeholder.configure({ placeholder }),
            Underline.configure(),
            TextStyle.configure(),
            EnterHandler.configure({ onEnterRef }),
            CustomStickerNode.configure(),
            StickerTrigger.configure({ suggestion: stickerSuggestion }), // Працюють :стікери:

            // Лічильник символів з нашою змінною
            CharacterCount.configure({ limit: charLimit }),
            // Фокус-мод (додає клас .has-focus до активного абзацу)
            Focus.configure({ className: 'has-focus', mode: 'all' }),
        ];

        // StarterKit підключаємо ЛИШЕ 1 РАЗ залежно від пресета
        if (preset === 'post') {
            extensions.push(
                StarterKit.configure({
                    heading: { levels: [1, 2, 3] },
                    blockquote: true,
                    horizontalRule: true,
                    bulletList: false, orderedList: false, listItem: false, codeBlock: false
                })
            );
        } else {
            extensions.push(
                StarterKit.configure({
                    bulletList: false, orderedList: false, listItem: false,
                    heading: false, codeBlock: false, blockquote: false, horizontalRule: false
                })
            );
        }

        // Унікальні плагіни для пресетів
        if (preset === 'bio') {
            extensions.push(Link.configure({ openOnClick: false }));
        }

        if (preset === 'comment') {
            extensions.push(
                Link.configure({ openOnClick: false }),
                Mention.configure({ HTMLAttributes: { class: 'user-mention' }, suggestion: mentionSuggestion }),
                SpoilerMark.configure()
            );
        }

        if (preset === 'post') {
            extensions.push(
                Color.configure(),
                FontFamily.configure(),
                FontSize.configure(),
                Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' } }),
                Mention.configure({ HTMLAttributes: { class: 'user-mention' }, suggestion: mentionSuggestion }),
                SpoilerMark.configure(),
                BulletList.configure(), OrderedList.configure(), ListItem.configure(),
                Table.configure({ resizable: true }), TableRow.configure(), TableHeader.configure(), TableCell.configure(),
                Subscript.configure(), Superscript.configure(), Highlight.configure({ multicolor: true }),
                PullquoteNode.configure(), DetailsNode.configure(), SummaryNode.configure(),
                CodeBlockLowlight.configure({ lowlight }),

                // Вирівнювання тексту та Унікальні ID
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                UniqueId.configure({ types: ['heading', 'paragraph', 'blockquote', 'codeBlock', 'bulletList', 'orderedList', 'listItem'] })
            );
        }

        return extensions;
    }, [preset, placeholder]);
}