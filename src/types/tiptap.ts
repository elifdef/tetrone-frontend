export type TipTapAllowedFontFamily =
    | 'Tahoma'
    | 'Arial'
    | 'Times New Roman'
    | 'Verdana'
    | 'Georgia'
    | 'Courier New';

export type TipTapAllowedFontSize =
    | '11px'
    | '12px'
    | '13px'
    | '14px'
    | '15px'
    | '16px';

export type TipTapTextAlign = 'left' | 'center' | 'right' | 'justify';

export type TipTapHeadingLevel = 1 | 2 | 3;

export type EditorPresetName = 'post' | 'comment' | 'message' | 'bio' | 'default';

export type EditorFormatFeature =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'code'
    | 'subscript'
    | 'superscript'
    | 'highlight'
    | 'spoiler'
    | 'link'
    | 'hashtag'
    | 'color'
    | 'fontFamily'
    | 'fontSize'
    | 'textAlign'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'horizontalRule'
    | 'bulletList'
    | 'orderedList'
    | 'taskList'
    | 'blockquote'
    | 'pullquote'
    | 'codeBlock'
    | 'details'
    | 'table'
    | 'mention'
    | 'sticker';

export type TipTapNodeType =
    | 'doc'
    | 'paragraph'
    | 'text'
    | 'hardBreak'
    | 'customSticker'
    | 'mention'
    | 'bulletList'
    | 'orderedList'
    | 'listItem'
    | 'taskList'
    | 'taskItem'
    | 'table'
    | 'tableRow'
    | 'tableHeader'
    | 'tableCell'
    | 'heading'
    | 'blockquote'
    | 'codeBlock'
    | 'horizontalRule'
    | 'pullquote'
    | 'details'
    | 'summary';

export type TipTapMarkType =
    | 'bold'
    | 'italic'
    | 'strike'
    | 'underline'
    | 'spoiler'
    | 'textStyle'
    | 'link'
    | 'code'
    | 'subscript'
    | 'superscript'
    | 'highlight'
    | 'hashtag';

// ==================== MARKS ====================

export interface TipTapBoldMark {
    type: 'bold';
}

export interface TipTapItalicMark {
    type: 'italic';
}

export interface TipTapUnderlineMark {
    type: 'underline';
}

export interface TipTapStrikeMark {
    type: 'strike';
}

export interface TipTapCodeMark {
    type: 'code';
}

export interface TipTapSubscriptMark {
    type: 'subscript';
}

export interface TipTapSuperscriptMark {
    type: 'superscript';
}

export interface TipTapSpoilerMark {
    type: 'spoiler';
}

export interface TipTapLinkMarkAttrs {
    href?: string;
    target?: string | null;
    rel?: string | null;
    class?: string | null;
}

export interface TipTapLinkMark {
    type: 'link';
    attrs?: TipTapLinkMarkAttrs;
}

export interface TipTapTextStyleMarkAttrs {
    color?: string | null;
    fontFamily?: TipTapAllowedFontFamily | string | null;
    fontSize?: TipTapAllowedFontSize | string | null;
}

export interface TipTapTextStyleMark {
    type: 'textStyle';
    attrs?: TipTapTextStyleMarkAttrs;
}

export interface TipTapHighlightMarkAttrs {
    color?: string | null;
}

export interface TipTapHighlightMark {
    type: 'highlight';
    attrs?: TipTapHighlightMarkAttrs;
}

export interface TipTapHashtagMarkAttrs {
    'data-hashtag'?: string | null;
}

export interface TipTapHashtagMark {
    type: 'hashtag';
    attrs?: TipTapHashtagMarkAttrs;
}

export type TipTapMark =
    | TipTapBoldMark
    | TipTapItalicMark
    | TipTapUnderlineMark
    | TipTapStrikeMark
    | TipTapCodeMark
    | TipTapSubscriptMark
    | TipTapSuperscriptMark
    | TipTapSpoilerMark
    | TipTapLinkMark
    | TipTapTextStyleMark
    | TipTapHighlightMark
    | TipTapHashtagMark;

// ==================== INLINE NODES ====================

export interface TipTapTextNode {
    type: 'text';
    text: string;
    marks?: TipTapMark[];
}

export interface TipTapHardBreakNode {
    type: 'hardBreak';
}

export interface CustomStickerNodeAttrs {
    id?: string | number | null;
    shortcode?: string | null;
    src?: string | null;
    packName?: string | null;
}

export interface TipTapCustomStickerNode {
    type: 'customSticker';
    attrs?: CustomStickerNodeAttrs;
}

export interface MentionNodeAttrs {
    id: string | null;
    label?: string | null;
}

export interface TipTapMentionNode {
    type: 'mention';
    attrs: MentionNodeAttrs;
}

export type TipTapInlineNode =
    | TipTapTextNode
    | TipTapHardBreakNode
    | TipTapCustomStickerNode
    | TipTapMentionNode;

// ==================== BLOCK NODES ====================

export interface BlockIdAttrs {
    id?: string | null;
}

export interface ParagraphNodeAttrs extends BlockIdAttrs {
    textAlign?: TipTapTextAlign | null;
}

export interface TipTapParagraphNode {
    type: 'paragraph';
    attrs?: ParagraphNodeAttrs;
    content?: TipTapInlineNode[];
}

export interface HeadingNodeAttrs extends BlockIdAttrs {
    level: TipTapHeadingLevel;
    textAlign?: TipTapTextAlign | null;
}

export interface TipTapHeadingNode {
    type: 'heading';
    attrs: HeadingNodeAttrs;
    content?: TipTapInlineNode[];
}

export interface TipTapHorizontalRuleNode {
    type: 'horizontalRule';
}

export interface TipTapListItemNode {
    type: 'listItem';
    attrs?: BlockIdAttrs;
    content: TipTapBlockNode[];
}

export interface TipTapBulletListNode {
    type: 'bulletList';
    attrs?: BlockIdAttrs;
    content: TipTapListItemNode[];
}

export interface OrderedListNodeAttrs extends BlockIdAttrs {
    start?: number;
}

export interface TipTapOrderedListNode {
    type: 'orderedList';
    attrs?: OrderedListNodeAttrs;
    content: TipTapListItemNode[];
}

export interface TaskNodeAttrs extends BlockIdAttrs {
    checked?: boolean;
}

export interface TipTapTaskItemNode {
    type: 'taskItem';
    attrs?: TaskNodeAttrs;
    content: TipTapBlockNode[];
}

export interface TipTapTaskListNode {
    type: 'taskList';
    attrs?: TaskNodeAttrs;
    content: TipTapTaskItemNode[];
}

export interface TipTapBlockquoteNode {
    type: 'blockquote';
    attrs?: BlockIdAttrs;
    content: TipTapBlockNode[];
}

export interface PullquoteNodeAttrs extends BlockIdAttrs {
    color?: string | null;
}

export interface TipTapPullquoteNode {
    type: 'pullquote';
    attrs?: PullquoteNodeAttrs;
    content: TipTapBlockNode[];
}

export interface CodeBlockNodeAttrs extends BlockIdAttrs {
    language?: string | null;
}

export interface TipTapCodeBlockNode {
    type: 'codeBlock';
    attrs?: CodeBlockNodeAttrs;
    content?: TipTapTextNode[];
}

export interface TipTapSummaryNode {
    type: 'summary';
    content?: TipTapInlineNode[];
}

export interface DetailsNodeAttrs extends BlockIdAttrs {
    open?: boolean;
}

export interface TipTapDetailsNode {
    type: 'details';
    attrs?: DetailsNodeAttrs;
    content: [TipTapSummaryNode, ...TipTapBlockNode[]] | TipTapBlockNode[];
}

export interface TableCellNodeAttrs {
    colspan?: number;
    rowspan?: number;
    colwidth?: number[] | null;
    align?: TipTapTextAlign | null;
}

export interface TipTapTableHeaderNode {
    type: 'tableHeader';
    attrs?: TableCellNodeAttrs;
    content: TipTapBlockNode[];
}

export interface TipTapTableCellNode {
    type: 'tableCell';
    attrs?: TableCellNodeAttrs;
    content: TipTapBlockNode[];
}

export interface TipTapTableRowNode {
    type: 'tableRow';
    content: Array<TipTapTableHeaderNode | TipTapTableCellNode>;
}

export interface TipTapTableNode {
    type: 'table';
    content: TipTapTableRowNode[];
}

export type TipTapBlockNode =
    | TipTapParagraphNode
    | TipTapHeadingNode
    | TipTapHorizontalRuleNode
    | TipTapBulletListNode
    | TipTapOrderedListNode
    | TipTapListItemNode
    | TipTapTaskListNode
    | TipTapTaskItemNode
    | TipTapBlockquoteNode
    | TipTapPullquoteNode
    | TipTapCodeBlockNode
    | TipTapDetailsNode
    | TipTapSummaryNode
    | TipTapTableNode
    | TipTapTableRowNode
    | TipTapTableHeaderNode
    | TipTapTableCellNode
    | TipTapHardBreakNode;

export type TipTapNode = TipTapBlockNode | TipTapInlineNode;

export interface TipTapDoc {
    type: 'doc';
    content: TipTapBlockNode[];
}

export type TipTapAnyNode = TipTapDoc | TipTapNode;

export function isTipTapDoc(value: unknown): value is TipTapDoc {
    return Boolean(
        value &&
            typeof value === 'object' &&
            (value as { type?: unknown }).type === 'doc' &&
            Array.isArray((value as { content?: unknown }).content)
    );
}

export function isTipTapTextNode(node: TipTapAnyNode): node is TipTapTextNode {
    return node.type === 'text' && typeof (node as TipTapTextNode).text === 'string';
}

export function isTipTapStickerNode(node: TipTapAnyNode): node is TipTapCustomStickerNode {
    return node.type === 'customSticker';
}

export function isTipTapMentionNode(node: TipTapAnyNode): node is TipTapMentionNode {
    return node.type === 'mention';
}

export function hasTipTapChildren(node: TipTapAnyNode): node is TipTapAnyNode & { content: TipTapNode[] } {
    return 'content' in node && Array.isArray(node.content);
}