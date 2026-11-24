import type {
    EditorFormatFeature,
    EditorPresetName,
    TipTapAllowedFontFamily,
    TipTapAllowedFontSize,
    TipTapDoc,
    TipTapMark,
    TipTapMarkType,
    TipTapNode,
    TipTapNodeType,
    TipTapTextAlign,
} from '@/types/tiptap';

export const ALLOWED_FONTS: readonly TipTapAllowedFontFamily[] = [
    'Tahoma',
    'Arial',
    'Times New Roman',
    'Verdana',
    'Georgia',
    'Courier New',
] as const;

export const ALLOWED_FONT_SIZES: readonly TipTapAllowedFontSize[] = [
    '11px',
    '12px',
    '13px',
    '14px',
    '15px',
    '16px',
] as const;

export const ALLOWED_TEXT_ALIGNS: readonly TipTapTextAlign[] = [
    'left',
    'center',
    'right',
    'justify',
] as const;

const ALLOWED_FONTS_SET = new Set<string>(ALLOWED_FONTS);
const ALLOWED_SIZES_SET = new Set<string>(ALLOWED_FONT_SIZES);
const ALLOWED_ALIGNS_SET = new Set<string>(ALLOWED_TEXT_ALIGNS);

const HEX_COLOR_REGEX = /^#([a-f0-9]{3}){1,2}$/i;
const HTTP_URL_REGEX = /^https?:\/\/.+/i;

export const MAX_TIPTAP_DEPTH = 50;
export const MAX_TIPTAP_NODES = 2000;

export interface EditorPresetConfig {
    name: EditorPresetName;
    maxLength: number;
    allowedNodes: ReadonlySet<TipTapNodeType>;
    allowedMarks: ReadonlySet<TipTapMarkType>;
    allowedFeatures: ReadonlySet<EditorFormatFeature>;
}

const BASE_NODES: readonly TipTapNodeType[] = [
    'doc',
    'paragraph',
    'text',
    'hardBreak',
    'customSticker',
    'mention',
];

const POST_NODES: readonly TipTapNodeType[] = [
    ...BASE_NODES,
    'bulletList',
    'orderedList',
    'listItem',
    'taskList',
    'taskItem',
    'table',
    'tableRow',
    'tableHeader',
    'tableCell',
    'heading',
    'blockquote',
    'codeBlock',
    'horizontalRule',
    'pullquote',
    'details',
    'summary',
];

const MESSAGE_NODES: readonly TipTapNodeType[] = [
    ...BASE_NODES,
    'bulletList',
    'orderedList',
    'listItem',
    'table',
    'tableRow',
    'tableHeader',
    'tableCell',
    'codeBlock',
    'blockquote',
    'horizontalRule',
];

const POST_MARKS: readonly TipTapMarkType[] = [
    'bold',
    'italic',
    'strike',
    'underline',
    'spoiler',
    'textStyle',
    'link',
    'code',
    'subscript',
    'superscript',
    'highlight',
    'hashtag',
];

const MESSAGE_MARKS: readonly TipTapMarkType[] = [
    'bold',
    'italic',
    'strike',
    'underline',
    'spoiler',
    'link',
    'code',
    'textStyle',
    'highlight',
];

const COMMENT_MARKS: readonly TipTapMarkType[] = [
    'bold',
    'italic',
    'strike',
    'underline',
    'spoiler',
];

const DEFAULT_MARKS: readonly TipTapMarkType[] = ['bold', 'italic'];

const POST_FEATURES: readonly EditorFormatFeature[] = [
    'bold',
    'italic',
    'underline',
    'strike',
    'code',
    'subscript',
    'superscript',
    'highlight',
    'spoiler',
    'link',
    'hashtag',
    'color',
    'fontFamily',
    'fontSize',
    'textAlign',
    'heading1',
    'heading2',
    'heading3',
    'horizontalRule',
    'bulletList',
    'orderedList',
    'taskList',
    'blockquote',
    'pullquote',
    'codeBlock',
    'details',
    'table',
    'mention',
    'sticker',
];

const MESSAGE_FEATURES: readonly EditorFormatFeature[] = [
    'bold',
    'italic',
    'underline',
    'strike',
    'code',
    'highlight',
    'spoiler',
    'link',
    'color',
    'fontFamily',
    'fontSize',
    'horizontalRule',
    'bulletList',
    'orderedList',
    'blockquote',
    'codeBlock',
    'table',
    'mention',
    'sticker',
];

const COMMENT_FEATURES: readonly EditorFormatFeature[] = [
    'bold',
    'italic',
    'underline',
    'strike',
    'spoiler',
    'mention',
    'sticker',
];

const BIO_FEATURES: readonly EditorFormatFeature[] = [
    'bold',
    'italic',
    'mention',
    'sticker',
];

const PRESET_CONFIGS: Record<EditorPresetName, EditorPresetConfig> = {
    post: {
        name: 'post',
        maxLength: 15000,
        allowedNodes: new Set<TipTapNodeType>(POST_NODES),
        allowedMarks: new Set<TipTapMarkType>(POST_MARKS),
        allowedFeatures: new Set<EditorFormatFeature>(POST_FEATURES),
    },
    message: {
        name: 'message',
        maxLength: 4000,
        allowedNodes: new Set<TipTapNodeType>(MESSAGE_NODES),
        allowedMarks: new Set<TipTapMarkType>(MESSAGE_MARKS),
        allowedFeatures: new Set<EditorFormatFeature>(MESSAGE_FEATURES),
    },
    comment: {
        name: 'comment',
        maxLength: 2000,
        allowedNodes: new Set<TipTapNodeType>(BASE_NODES),
        allowedMarks: new Set<TipTapMarkType>(COMMENT_MARKS),
        allowedFeatures: new Set<EditorFormatFeature>(COMMENT_FEATURES),
    },
    bio: {
        name: 'bio',
        maxLength: 1000,
        allowedNodes: new Set<TipTapNodeType>(BASE_NODES),
        allowedMarks: new Set<TipTapMarkType>(DEFAULT_MARKS),
        allowedFeatures: new Set<EditorFormatFeature>(BIO_FEATURES),
    },
    default: {
        name: 'default',
        maxLength: 2048,
        allowedNodes: new Set<TipTapNodeType>(BASE_NODES),
        allowedMarks: new Set<TipTapMarkType>(DEFAULT_MARKS),
        allowedFeatures: new Set<EditorFormatFeature>(BIO_FEATURES),
    },
};

export function getPresetConfig(preset: EditorPresetName | string = 'post'): EditorPresetConfig {
    if (Object.prototype.hasOwnProperty.call(PRESET_CONFIGS, preset)) {
        return PRESET_CONFIGS[preset as EditorPresetName];
    }
    return PRESET_CONFIGS.default;
}

export function hasEditorFeature(
    preset: EditorPresetName | string,
    feature: EditorFormatFeature
): boolean {
    return getPresetConfig(preset).allowedFeatures.has(feature);
}

export function isValidHexColor(color: unknown): color is string {
    return typeof color === 'string' && HEX_COLOR_REGEX.test(color);
}

export function isValidHttpUrl(href: unknown): href is string {
    if (typeof href !== 'string' || !HTTP_URL_REGEX.test(href)) return false;
    try {
        const parsed = new URL(href);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

export function isValidStickerSrc(src: unknown): src is string {
    if (typeof src !== 'string') return false;
    const trimmed = src.trim();
    if (trimmed === '') return false;
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        return true;
    }
    return isValidHttpUrl(trimmed);
}

export type TipTapValidationErrorCode =
    | 'INVALID_ROOT'
    | 'DISALLOWED_NODE'
    | 'DISALLOWED_MARK'
    | 'DISALLOWED_NESTING'
    | 'INVALID_ATTRIBUTE'
    | 'TEXT_TOO_LONG'
    | 'MAX_DEPTH_EXCEEDED'
    | 'MAX_NODES_EXCEEDED';

export interface TipTapValidationError {
    code: TipTapValidationErrorCode;
    path: string;
    detail?: string;
}

export interface TipTapValidationResult {
    valid: boolean;
    errors: TipTapValidationError[];
    textLength: number;
    nodeCount: number;
}

interface NestingContext {
    inTable: boolean;
    inDetails: boolean;
    inBlockquote: boolean;
}

const ALLOWED_NODE_ATTRS: Partial<Record<TipTapNodeType, readonly string[]>> = {
    paragraph: ['id', 'textAlign'],
    heading: ['id', 'textAlign', 'level'],
    blockquote: ['id'],
    codeBlock: ['id', 'language'],
    bulletList: ['id'],
    orderedList: ['id', 'start'],
    listItem: ['id'],
    customSticker: ['id', 'shortcode', 'src', 'packName'],
    mention: ['id', 'label'],
    tableCell: ['colspan', 'rowspan', 'colwidth', 'align'],
    tableHeader: ['colspan', 'rowspan', 'colwidth', 'align'],
    taskList: ['id', 'checked'],
    taskItem: ['id', 'checked'],
    details: ['id', 'open'],
    pullquote: ['id', 'color'],
};

export function validateTipTapDoc(
    doc: unknown,
    preset: EditorPresetName | string = 'post',
    maxLengthOverride?: number
): TipTapValidationResult {
    const config = getPresetConfig(preset);
    const maxLen = maxLengthOverride ?? config.maxLength;
    const errors: TipTapValidationError[] = [];
    let textLength = 0;
    let nodeCount = 0;

    if (!doc || typeof doc !== 'object' || (doc as { type?: unknown }).type !== 'doc') {
        return {
            valid: false,
            errors: [{ code: 'INVALID_ROOT', path: '$' }],
            textLength: 0,
            nodeCount: 0,
        };
    }

    const walk = (node: unknown, path: string, depth: number, ctx: NestingContext): void => {
        if (depth > MAX_TIPTAP_DEPTH) {
            errors.push({ code: 'MAX_DEPTH_EXCEEDED', path });
            return;
        }
        if (nodeCount > MAX_TIPTAP_NODES) {
            errors.push({ code: 'MAX_NODES_EXCEEDED', path });
            return;
        }
        if (!node || typeof node !== 'object') {
            errors.push({ code: 'INVALID_ROOT', path });
            return;
        }

        const raw = node as Record<string, unknown>;
        const nodeType = raw.type;
        if (typeof nodeType !== 'string' || !config.allowedNodes.has(nodeType as TipTapNodeType)) {
            errors.push({
                code: 'DISALLOWED_NODE',
                path,
                detail: String(nodeType ?? 'unknown'),
            });
            return;
        }

        const typedNode = nodeType as TipTapNodeType;

        if (typedNode === 'table' && ctx.inTable) {
            errors.push({ code: 'DISALLOWED_NESTING', path, detail: 'table' });
            return;
        }
        if (typedNode === 'details' && ctx.inDetails) {
            errors.push({ code: 'DISALLOWED_NESTING', path, detail: 'details' });
            return;
        }
        if (typedNode === 'blockquote' && ctx.inBlockquote) {
            errors.push({ code: 'DISALLOWED_NESTING', path, detail: 'blockquote' });
            return;
        }

        nodeCount += 1;

        if (typedNode === 'text') {
            if (typeof raw.text !== 'string') {
                errors.push({ code: 'INVALID_ATTRIBUTE', path: `${path}.text`, detail: 'text must be string' });
            } else {
                textLength += Array.from(raw.text).length;
            }
        }

        if (raw.attrs !== undefined && raw.attrs !== null) {
            if (typeof raw.attrs !== 'object' || Array.isArray(raw.attrs)) {
                errors.push({ code: 'INVALID_ATTRIBUTE', path: `${path}.attrs` });
            } else {
                const attrs = raw.attrs as Record<string, unknown>;
                if (
                    attrs.textAlign !== undefined &&
                    attrs.textAlign !== null &&
                    !ALLOWED_ALIGNS_SET.has(String(attrs.textAlign))
                ) {
                    errors.push({ code: 'INVALID_ATTRIBUTE', path: `${path}.attrs.textAlign`, detail: String(attrs.textAlign) });
                }
                if (typedNode === 'heading') {
                    const lvl = Number(attrs.level);
                    if (![1, 2, 3].includes(lvl)) {
                        errors.push({ code: 'INVALID_ATTRIBUTE', path: `${path}.attrs.level`, detail: String(attrs.level) });
                    }
                }
                if (typedNode === 'pullquote' && attrs.color !== undefined && attrs.color !== null) {
                    if (!isValidHexColor(attrs.color)) {
                        errors.push({ code: 'INVALID_ATTRIBUTE', path: `${path}.attrs.color`, detail: String(attrs.color) });
                    }
                }
                if (typedNode === 'customSticker' && attrs.src !== undefined && attrs.src !== null && attrs.src !== '') {
                    if (!isValidStickerSrc(attrs.src)) {
                        errors.push({ code: 'INVALID_ATTRIBUTE', path: `${path}.attrs.src`, detail: String(attrs.src) });
                    }
                }
            }
        }

        if (Array.isArray(raw.marks)) {
            raw.marks.forEach((mark, idx) => {
                const markPath = `${path}.marks[${idx}]`;
                if (!mark || typeof mark !== 'object') {
                    errors.push({ code: 'DISALLOWED_MARK', path: markPath });
                    return;
                }
                const m = mark as Record<string, unknown>;
                const mType = m.type;
                if (typeof mType !== 'string' || !config.allowedMarks.has(mType as TipTapMarkType)) {
                    errors.push({
                        code: 'DISALLOWED_MARK',
                        path: markPath,
                        detail: String(mType ?? 'unknown'),
                    });
                    return;
                }

                const mAttrs = (m.attrs && typeof m.attrs === 'object' ? m.attrs : {}) as Record<string, unknown>;
                if (mType === 'link' && mAttrs.href !== undefined && mAttrs.href !== null && mAttrs.href !== '') {
                    if (!isValidHttpUrl(mAttrs.href)) {
                        errors.push({ code: 'INVALID_ATTRIBUTE', path: `${markPath}.attrs.href`, detail: String(mAttrs.href) });
                    }
                }
                if (mType === 'textStyle') {
                    if (mAttrs.fontFamily !== undefined && mAttrs.fontFamily !== null && mAttrs.fontFamily !== '') {
                        if (!ALLOWED_FONTS_SET.has(String(mAttrs.fontFamily))) {
                            errors.push({ code: 'INVALID_ATTRIBUTE', path: `${markPath}.attrs.fontFamily`, detail: String(mAttrs.fontFamily) });
                        }
                    }
                    if (mAttrs.fontSize !== undefined && mAttrs.fontSize !== null && mAttrs.fontSize !== '') {
                        if (!ALLOWED_SIZES_SET.has(String(mAttrs.fontSize))) {
                            errors.push({ code: 'INVALID_ATTRIBUTE', path: `${markPath}.attrs.fontSize`, detail: String(mAttrs.fontSize) });
                        }
                    }
                    if (mAttrs.color !== undefined && mAttrs.color !== null && mAttrs.color !== '') {
                        if (!isValidHexColor(mAttrs.color)) {
                            errors.push({ code: 'INVALID_ATTRIBUTE', path: `${markPath}.attrs.color`, detail: String(mAttrs.color) });
                        }
                    }
                }
                if (mType === 'highlight' && mAttrs.color !== undefined && mAttrs.color !== null && mAttrs.color !== '') {
                    if (!isValidHexColor(mAttrs.color)) {
                        errors.push({ code: 'INVALID_ATTRIBUTE', path: `${markPath}.attrs.color`, detail: String(mAttrs.color) });
                    }
                }
            });
        }

        if (Array.isArray(raw.content)) {
            const nextCtx: NestingContext = {
                inTable: ctx.inTable || typedNode === 'table',
                inDetails: ctx.inDetails || typedNode === 'details',
                inBlockquote: ctx.inBlockquote || typedNode === 'blockquote',
            };
            raw.content.forEach((child, idx) => {
                walk(child, `${path}.content[${idx}]`, depth + 1, nextCtx);
            });
        }
    };

    walk(doc, '$', 0, { inTable: false, inDetails: false, inBlockquote: false });

    if (textLength > maxLen) {
        errors.push({
            code: 'TEXT_TOO_LONG',
            path: '$',
            detail: `${textLength} > ${maxLen}`,
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        textLength,
        nodeCount,
    };
}

function sanitizeAttrs(type: TipTapNodeType, rawAttrs: Record<string, unknown>): Record<string, unknown> {
    const allowed = ALLOWED_NODE_ATTRS[type] ?? [];
    const clean: Record<string, unknown> = {};

    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(rawAttrs, key) && rawAttrs[key] !== undefined) {
            clean[key] = rawAttrs[key];
        }
    }

    if (clean.textAlign !== undefined && clean.textAlign !== null && !ALLOWED_ALIGNS_SET.has(String(clean.textAlign))) {
        delete clean.textAlign;
    }

    if (clean.color !== undefined && clean.color !== null && !isValidHexColor(clean.color)) {
        delete clean.color;
    }

    if (type === 'heading' && ![1, 2, 3].includes(Number(clean.level))) {
        clean.level = 1;
    }

    if (type === 'customSticker' && clean.src !== undefined && clean.src !== null && clean.src !== '') {
        if (!isValidStickerSrc(clean.src)) {
            delete clean.src;
        }
    }

    return clean;
}

function sanitizeMark(
    mark: unknown,
    allowedMarks: ReadonlySet<TipTapMarkType>
): TipTapMark | null {
    if (!mark || typeof mark !== 'object') return null;
    const raw = mark as Record<string, unknown>;
    const type = raw.type;

    if (typeof type !== 'string' || !allowedMarks.has(type as TipTapMarkType)) {
        return null;
    }

    const markType = type as TipTapMarkType;
    const rawAttrs =
        raw.attrs && typeof raw.attrs === 'object' && !Array.isArray(raw.attrs)
            ? (raw.attrs as Record<string, unknown>)
            : null;

    if (markType === 'link') {
        if (rawAttrs?.href && isValidHttpUrl(rawAttrs.href)) {
            return {
                type: 'link',
                attrs: {
                    href: rawAttrs.href,
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                },
            };
        }
        return { type: 'link' };
    }

    if (markType === 'textStyle') {
        const cleanAttrs: Record<string, unknown> = {};
        if (rawAttrs?.fontSize && ALLOWED_SIZES_SET.has(String(rawAttrs.fontSize))) {
            cleanAttrs.fontSize = String(rawAttrs.fontSize);
        }
        if (rawAttrs?.fontFamily && ALLOWED_FONTS_SET.has(String(rawAttrs.fontFamily))) {
            cleanAttrs.fontFamily = String(rawAttrs.fontFamily);
        }
        if (rawAttrs?.color && isValidHexColor(rawAttrs.color)) {
            cleanAttrs.color = rawAttrs.color;
        }
        if (Object.keys(cleanAttrs).length === 0) {
            return null;
        }
        return {
            type: 'textStyle',
            attrs: cleanAttrs,
        };
    }

    if (markType === 'highlight') {
        if (rawAttrs?.color && isValidHexColor(rawAttrs.color)) {
            return {
                type: 'highlight',
                attrs: { color: rawAttrs.color },
            };
        }
        return { type: 'highlight' };
    }

    if (markType === 'hashtag') {
        if (typeof rawAttrs?.['data-hashtag'] === 'string' && rawAttrs['data-hashtag'].trim() !== '') {
            return {
                type: 'hashtag',
                attrs: { 'data-hashtag': rawAttrs['data-hashtag'] },
            };
        }
        return { type: 'hashtag' };
    }

    return { type: markType } as TipTapMark;
}

export function sanitizeTipTapDoc(
    doc: unknown,
    preset: EditorPresetName | string = 'post'
): TipTapDoc {
    const config = getPresetConfig(preset);
    let nodeCount = 0;

    const sanitizeNode = (
        node: unknown,
        depth: number,
        ctx: NestingContext
    ): TipTapDoc | TipTapNode | null => {
        if (depth > MAX_TIPTAP_DEPTH || nodeCount > MAX_TIPTAP_NODES) return null;
        if (!node || typeof node !== 'object') return null;

        const raw = node as Record<string, unknown>;
        const rawType = raw.type;
        if (typeof rawType !== 'string' || !config.allowedNodes.has(rawType as TipTapNodeType)) {
            return null;
        }

        const type = rawType as TipTapNodeType;

        if (type === 'table' && ctx.inTable) return null;
        if (type === 'details' && ctx.inDetails) return null;
        if (type === 'blockquote' && ctx.inBlockquote) return null;

        nodeCount += 1;

        if (type === 'text') {
            if (typeof raw.text !== 'string') return null;
            const cleanText: Record<string, unknown> = {
                type: 'text',
                text: raw.text,
            };
            if (Array.isArray(raw.marks)) {
                const marks = raw.marks
                    .map((m) => sanitizeMark(m, config.allowedMarks))
                    .filter((m): m is TipTapMark => m !== null);
                if (marks.length > 0) {
                    cleanText.marks = marks;
                }
            }
            return cleanText as unknown as TipTapNode;
        }

        const cleanNode: Record<string, unknown> = { type };

        if (raw.attrs && typeof raw.attrs === 'object' && !Array.isArray(raw.attrs)) {
            const cleanAttrs = sanitizeAttrs(type, raw.attrs as Record<string, unknown>);
            if (Object.keys(cleanAttrs).length > 0) {
                cleanNode.attrs = cleanAttrs;
            }
        }

        if (Array.isArray(raw.content)) {
            const nextCtx: NestingContext = {
                inTable: ctx.inTable || type === 'table',
                inDetails: ctx.inDetails || type === 'details',
                inBlockquote: ctx.inBlockquote || type === 'blockquote',
            };
            const cleanChildren = raw.content
                .map((child) => sanitizeNode(child, depth + 1, nextCtx))
                .filter((child): child is TipTapNode => child !== null && child.type !== 'doc');

            if (
                cleanChildren.length > 0 ||
                type === 'paragraph' ||
                type === 'doc' ||
                type === 'tableCell' ||
                type === 'tableHeader'
            ) {
                cleanNode.content = cleanChildren;
            }
        }

        return cleanNode as unknown as TipTapDoc | TipTapNode;
    };

    const sanitized = sanitizeNode(doc, 0, {
        inTable: false,
        inDetails: false,
        inBlockquote: false,
    });

    if (sanitized && sanitized.type === 'doc') {
        return {
            type: 'doc',
            content: Array.isArray(sanitized.content) ? sanitized.content : [],
        };
    }

    return { type: 'doc', content: [] };
}

export function getTipTapTextLength(doc: unknown): number {
    if (!doc || typeof doc !== 'object') return 0;
    let total = 0;

    const walk = (node: unknown): void => {
        if (!node || typeof node !== 'object') return;
        const n = node as Record<string, unknown>;
        if (n.type === 'text' && typeof n.text === 'string') {
            total += Array.from(n.text).length;
        }
        if (Array.isArray(n.content)) {
            n.content.forEach(walk);
        }
    };

    walk(doc);
    return total;
}

export function isTipTapDocEmpty(doc: unknown): boolean {
    if (!doc || typeof doc !== 'object') return true;
    const d = doc as { type?: unknown; content?: unknown };
    if (d.type !== 'doc' || !Array.isArray(d.content) || d.content.length === 0) return true;

    let hasContent = false;
    const check = (node: unknown): void => {
        if (hasContent || !node || typeof node !== 'object') return;
        const n = node as Record<string, unknown>;
        if (n.type === 'text' && typeof n.text === 'string' && n.text.trim().length > 0) {
            hasContent = true;
            return;
        }
        if (n.type === 'customSticker' || n.type === 'mention' || n.type === 'horizontalRule') {
            hasContent = true;
            return;
        }
        if (Array.isArray(n.content)) {
            n.content.forEach(check);
        }
    };

    d.content.forEach(check);
    return !hasContent;
}