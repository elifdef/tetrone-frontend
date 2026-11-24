import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import type { UserData } from '@/types/user';

export interface MentionListHandle {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface MentionListProps {
    items: UserData[];
    query?: string;
    command: (props: { id: string; label: string }) => void;
}

const MentionList = forwardRef<MentionListHandle, MentionListProps>((props, ref) => {
    const { t } = useTranslation();
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.username, label: item.username });
        }
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

    const queryLength = (props.query || '').trim().length;
    if (queryLength < 2 && props.items.length === 0) {
        return null;
    }

    return (
        <div className="bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex flex-col p-[4px] min-w-[180px] z-[9999] overflow-hidden">
            {props.items.length > 0 ? (
                props.items.map((item, index) => {
                    const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ') || item.username;
                    return (
                        <button
                            type="button"
                            className={`flex items-center gap-[8px] p-[6px] bg-transparent border-none w-full text-left cursor-pointer transition-colors outline-none ${
                                index === selectedIndex ? 'bg-[rgba(128,128,128,0.1)]' : 'hover:bg-[rgba(128,128,128,0.05)]'
                            }`}
                            key={item.username || index}
                            onClick={() => selectItem(index)}
                        >
                            <Avatar user={item} className="w-[24px] h-[24px] object-cover shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[12px] font-bold text-text-main truncate leading-[1.2]">{fullName}</span>
                                <span className="text-[11px] text-text-muted truncate">@{item.username}</span>
                            </div>
                        </button>
                    );
                })
            ) : (
                <div className="p-[6px] text-[11px] text-text-muted italic text-center">
                    {t('editor.mention_not_found')}
                </div>
            )}
        </div>
    );
});

MentionList.displayName = 'MentionList';
export default MentionList;