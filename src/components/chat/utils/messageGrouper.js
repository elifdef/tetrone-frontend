const getSenderKey = (m, currentUser, activeChat) => {
    if (!m) return null;
    if (m.author_type === 'group') return `group_${activeChat?.slug}`;
    return m.isMine ? currentUser?.username : m.author?.username;
};

export const groupMessagesByDay = (messages, currentUser, activeChat, language = 'uk-UA') => {
    const groups = [];

    messages.forEach((msg) => {
        const d = new Date(msg.created_at);
        const dateKey = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString(language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        let currentGroup = groups[groups.length - 1];
        if (!currentGroup || currentGroup.dateKey !== dateKey) {
            currentGroup = { dateKey, label, items: [] };
            groups.push(currentGroup);
        }

        const prevItem = currentGroup.items[currentGroup.items.length - 1];
        const currSenderKey = getSenderKey(msg, currentUser, activeChat);
        const prevSenderKey = prevItem ? getSenderKey(prevItem, currentUser, activeChat) : null;
        const isForwarded = Boolean(msg.forwarded_from);

        if (isForwarded) {
            const prevTime = prevItem?.last_created_at || prevItem?.created_at;
            const timeDiffMs = prevTime
                ? Math.abs(d.getTime() - new Date(prevTime).getTime())
                : Infinity;

            if (
                prevItem?.isForwardBundle &&
                prevSenderKey === currSenderKey &&
                timeDiffMs <= 5000
            ) {
                prevItem.forwardedItems.push(msg);
                prevItem.bundleUuids.push(msg.uuid);
                prevItem.last_created_at = msg.created_at;
                prevItem.is_important = prevItem.is_important || Boolean(msg.is_important);
                prevItem.is_pinned = prevItem.is_pinned || Boolean(msg.is_pinned);
                return;
            }

            const isSameAuthor = Boolean(prevItem && prevSenderKey === currSenderKey);
            currentGroup.items.push({
                ...msg,
                isForwardBundle: true,
                forwardedItems: [msg],
                bundleUuids: [msg.uuid],
                last_created_at: msg.created_at,
                isSameAuthor
            });
            return;
        }

        const isSameAuthor = Boolean(
            prevItem &&
            prevSenderKey === currSenderKey &&
            !msg.shared_post
        );

        currentGroup.items.push({
            ...msg,
            isForwardBundle: false,
            bundleUuids: [msg.uuid],
            isSameAuthor
        });
    });

    return groups;
};