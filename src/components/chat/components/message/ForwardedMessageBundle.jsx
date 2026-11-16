import React from 'react';
import { Link } from 'react-router';
import Avatar from '@ui/Avatar';
import NestedForwardChain from './NestedForwardChain.jsx';
import MessageContent from './MessageContent.jsx';

export default React.memo(function ForwardedMessageBundle({
    msg,
    myself,
    activeChat
}) {
    const items = msg.forwardedItems || [msg];

    return (
        <div className="mt-[2px] pl-[10px] border-l-[2px] border-theme-link flex flex-col gap-[3px]">
            {items.map((fItem, idx) => {
                const orig = fItem.forwarded_from || {};
                const origAuthor = orig.author || {};
                const origName =
                    orig.sender_name ||
                    [origAuthor.first_name, origAuthor.last_name].filter(Boolean).join(' ') ||
                    origAuthor.username ||
                    '';
                const origLink = origAuthor.username ? `/${origAuthor.username}` : null;
                const origColor = origAuthor?.personalization?.username_color;

                const prevOrig = idx > 0 ? items[idx - 1]?.forwarded_from : null;
                const prevKey = prevOrig
                    ? (prevOrig.author?.username || prevOrig.sender_name)
                    : null;
                const currKey = origAuthor.username || origName;
                const isSameOrigAuthor = Boolean(prevKey && prevKey === currKey);

                const content = (
                    <MessageContent
                        msg={fItem}
                        myself={myself}
                        activeChat={activeChat}
                        showStatusBadges={false}
                    />
                );

                return (
                    <div
                        key={fItem.uuid || idx}
                        id={`msg2-${fItem.uuid}`}
                        className={`flex items-start gap-[8px] ${isSameOrigAuthor ? 'pt-[1px]' : 'pt-[3px]'}`}
                    >
                        <div className="w-[30px] shrink-0">
                            {!isSameOrigAuthor && (
                                origLink ? (
                                    <Link to={origLink}>
                                        <Avatar
                                            user={origAuthor}
                                            className="w-[30px] h-[30px] object-cover border border-border block"
                                        />
                                    </Link>
                                ) : (
                                    <Avatar
                                        user={origAuthor}
                                        className="w-[30px] h-[30px] object-cover border border-border block"
                                    />
                                )
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            {!isSameOrigAuthor && (
                                <div className="flex items-center gap-[6px] mb-[2px]">
                                    {origLink ? (
                                        <Link
                                            to={origLink}
                                            className="text-[11px] font-bold hover:underline"
                                            style={origColor ? { color: origColor } : undefined}
                                        >
                                            <strong>{origName}</strong>
                                        </Link>
                                    ) : (
                                        <strong
                                            className="text-[11px]"
                                            style={origColor ? { color: origColor } : undefined}
                                        >
                                            {origName}
                                        </strong>
                                    )}
                                    {orig.date && (
                                        <span className="text-[10px] text-text-muted">
                                            {orig.date}
                                        </span>
                                    )}
                                </div>
                            )}

                            {orig.forwarded_from ? (
                                <NestedForwardChain chain={orig.forwarded_from} depth={2}>
                                    {content}
                                </NestedForwardChain>
                            ) : (
                                content
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});