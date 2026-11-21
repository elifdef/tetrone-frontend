import { useEffect, useState } from 'react';
import { useTetroneDebug } from '../../utils/debug';
import { useSocket } from '../../context/SocketContext';
import MediaAttachmentDebugBar from '../ui/MediaAttachmentDebugBar';

export default function PostAttachmentsDebugList({ attachments = [] }) {
    const isDebug = useTetroneDebug();
    const socketContext = useSocket();
    const socket = socketContext?.socket;
    const [items, setItems] = useState(attachments);

    useEffect(() => {
        setItems(Array.isArray(attachments) ? attachments : []);
    }, [attachments]);

    useEffect(() => {
        if (!isDebug || !socket || items.length === 0) return undefined;

        const hasProcessing = items.some((item) => item?.status === 'processing');
        if (!hasProcessing) return undefined;

        const handleReady = (data) => {
            if (!data?.id) return;
            setItems((prev) =>
                prev.map((item) =>
                    item.id === data.id
                        ? {
                              ...item,
                              status: data.status || 'ready',
                              file_path: data.file_path ?? item.file_path,
                              file_url: data.file_url || data.url || item.file_url,
                              url: data.file_url || data.url || item.url,
                              cover_url: data.cover_url ?? item.cover_url,
                              file_name: data.file_name ?? item.file_name,
                              original_name: data.original_name ?? item.original_name,
                              file_size: data.file_size ?? item.file_size,
                              meta: data.meta ?? item.meta,
                          }
                        : item
                )
            );
        };

        socket.on('attachment.ready', handleReady);
        return () => {
            socket.off('attachment.ready', handleReady);
        };
    }, [isDebug, socket, items]);

    if (!isDebug || !items || items.length === 0) return null;

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="w-full mt-[8px] flex flex-col gap-[4px] border-t border-border"
        >
            {items.map((att) => (
                <div key={att.id || att.file_path || att.original_name} className="flex flex-col">
                    <div className="px-[8px] pt-[4px] bg-bg-box/90 border-x border-border text-[10px] font-mono text-text-muted flex items-center gap-[6px]">
                        <span className="uppercase font-bold text-text-main">[{att.type || 'file'}]</span>
                        <span className="truncate">{att.original_name || att.file_name}</span>
                    </div>
                    <MediaAttachmentDebugBar attachment={att} />
                </div>
            ))}
        </div>
    );
}