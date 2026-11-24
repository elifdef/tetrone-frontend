import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export interface StickerSuggestionItem {
    id: number | string;
    shortcode: string;
    url: string;
    src?: string;
    keywords?: string;
    pack_short_name?: string;
    packName?: string;
}

export interface SuggestionListHandle {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface SuggestionListProps {
    items: StickerSuggestionItem[];
    command: (item: StickerSuggestionItem) => void;
}

const SuggestionList = forwardRef<SuggestionListHandle, SuggestionListProps>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) props.command(item);
    };

    const upHandler = () => {
        if (!props.items.length) return;
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };
    const downHandler = () => {
        if (!props.items.length) return;
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };
    const enterHandler = () => selectItem(selectedIndex);

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (!props.items || props.items.length === 0) return null;

    return (
        <div className="flex items-center gap-[4px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.2)] p-[4px] z-[9999] flex-wrap max-w-[250px]">
            {props.items.map((item, index) => (
                <div
                    key={item.id}
                    className={`flex items-center gap-[4px] p-[4px] cursor-pointer transition-colors rounded ${
                        index === selectedIndex ? 'bg-[rgba(128,128,128,0.1)]' : 'hover:bg-[rgba(128,128,128,0.05)]'
                    }`}
                    onClick={() => selectItem(index)}
                >
                    <img src={item.url} alt={item.shortcode} className="w-[20px] h-[20px] object-contain" />
                    <span className="text-[11px] text-text-main">:{item.shortcode}:</span>
                </div>
            ))}
        </div>
    );
});

SuggestionList.displayName = 'SuggestionList';
export default SuggestionList;