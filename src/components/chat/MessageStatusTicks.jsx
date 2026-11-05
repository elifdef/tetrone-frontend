import React from 'react';
import { useTranslation } from 'react-i18next';

export default function MessageStatusTicks({ msg, timeString }) {
    const { t } = useTranslation();

    const isRead = Boolean(msg.read_at || msg.status === 'read');

    return (
        <div className="text-[10px] text-text-muted flex items-center gap-[3px]">
            <span>{timeString}</span>
            {msg.isMine && (
                <span
                    className="inline-flex items-center select-none"
                    title={isRead ? t('chat.status.read') : t('chat.status.sent')}
                >
                    {isRead ? (
                        /* Дві сині галочки — прочитано */
                        <svg width="14" height="10" viewBox="0 0 16 11" fill="none" className="text-theme-link">
                            <path d="M11.5 1.5L5.5 8.5L2.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14.5 1.5L8.5 8.5L7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    ) : (
                        /* Одна сіра галочка — надіслано */
                        <svg width="11" height="10" viewBox="0 0 12 11" fill="none" className="text-text-muted">
                            <path d="M10 2L4.5 8.5L1.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    )}
                </span>
            )}
        </div>
    );
}