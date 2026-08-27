import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import Avatar from '../ui/Avatar';

const MentionList = forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [props.items]);

    const selectItem = index => {
        const item = props.items[index];
        if (item) props.command({ id: item.username, label: item.username });
    };

    const upHandler = () => setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    const downHandler = () => setSelectedIndex((selectedIndex + 1) % props.items.length);
    const enterHandler = () => selectItem(selectedIndex);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') return upHandler(), true;
            if (event.key === 'ArrowDown') return downHandler(), true;
            if (event.key === 'Enter') return enterHandler(), true;
            return false;
        },
    }));

    return (
        <div className="bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex flex-col p-[4px] min-w-[180px] z-[9999] overflow-hidden">
            {props.items.length > 0 ? (
                props.items.map((item, index) => {
                    const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ') || item.username;
                    return (
                        <button
                            className={`flex items-center gap-[8px] p-[6px] bg-transparent border-none w-full text-left cursor-pointer transition-colors outline-none ${index === selectedIndex ? 'bg-[rgba(128,128,128,0.1)]' : 'hover:bg-[rgba(128,128,128,0.05)]'}`}
                            key={index}
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
                <div className="p-[6px] text-[11px] text-text-muted italic text-center">Користувача не знайдено</div>
            )}
        </div>
    );
});

export default MentionList;