import { isTipTapTextNode, type TipTapMark, type TipTapNode } from '@/types/tiptap';

const decodeHtmlEntities = (text: string): string => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
};

export const decodeTipTapContent = <T,>(content: T): T => {
    if (!content) return content;
    if (typeof content === 'string') return content;

    if (Array.isArray(content)) {
        return content
            .map((item) => decodeTipTapContent(item))
            .filter((node) => {
                if (
                    node &&
                    typeof node === 'object' &&
                    (node as { type?: unknown }).type === 'text' &&
                    typeof (node as { text?: unknown }).text !== 'string'
                ) {
                    return false;
                }
                return true;
            }) as unknown as T;
    }

    if (typeof content === 'object') {
        const newObj = { ...(content as Record<string, unknown>) };
        if (newObj.type === 'text' && typeof newObj.text === 'string') {
            newObj.text = decodeHtmlEntities(newObj.text);
        }
        if (newObj.content) {
            newObj.content = decodeTipTapContent(newObj.content);
        }
        return newObj as T;
    }
    return content;
};

export const ensureMentionSpacing = <T,>(content: T): T => {
    if (!content) return content;
    if (Array.isArray(content)) return content.map((item) => ensureMentionSpacing(item)) as unknown as T;

    if (typeof content === 'object') {
        const newObj = { ...(content as Record<string, unknown>) };
        if (Array.isArray(newObj.content)) {
            const normalized = newObj.content.map((item) => ensureMentionSpacing(item) as TipTapNode);
            for (let i = 0; i < normalized.length - 1; i++) {
                const curr = normalized[i];
                const next = normalized[i + 1];
                if (
                    curr?.type === 'mention' &&
                    next?.type === 'text' &&
                    typeof next.text === 'string' &&
                    next.text.length > 0 &&
                    !/^[\s.,!?;:)\]]/.test(next.text)
                ) {
                    normalized[i + 1] = { ...next, text: ` ${next.text}` };
                }
            }
            newObj.content = normalized;
        }
        return newObj as T;
    }

    return content;
};

export const processHashtags = <T,>(content: T): T => {
    if (!content) return content;
    if (Array.isArray(content)) return content.map((item) => processHashtags(item)) as unknown as T;

    if (typeof content === 'object') {
        const newObj = { ...(content as Record<string, unknown>) };

        if (Array.isArray(newObj.content)) {
            const newChildren: TipTapNode[] = [];

            (newObj.content as TipTapNode[]).forEach((child) => {
                if (
                    isTipTapTextNode(child) &&
                    (!child.marks || !child.marks.some((m) => m.type === 'link' || m.type === 'hashtag'))
                ) {
                    const regex = /(#[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9_]+)/gu;
                    const parts = child.text.split(regex);

                    if (parts.length === 1) {
                        newChildren.push(processHashtags(child));
                    } else {
                        parts.forEach((part) => {
                            if (part.match(regex)) {
                                const marks: TipTapMark[] = child.marks ? [...child.marks] : [];
                                marks.push({
                                    type: 'hashtag',
                                    attrs: {
                                        'data-hashtag': part.slice(1).toLowerCase(),
                                    },
                                });
                                newChildren.push({ type: 'text', text: part, marks });
                            } else if (part) {
                                newChildren.push({ ...child, text: part });
                            }
                        });
                    }
                } else {
                    newChildren.push(processHashtags(child));
                }
            });
            newObj.content = newChildren;
        }
        return newObj as T;
    }
    return content;
};