import React from 'react';
import { useTranslation } from 'react-i18next';

const StarSvg = ({ filled }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const ReplySvg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 17 4 12 9 7" />
        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
);

const ForwardSvg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 17 20 12 15 7" />
        <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
);

const EditSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const PinSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="17" x2="12" y2="22" />
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
);

const FlagSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
);

const TrashSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function MessageActions({
    msg,
    onToggleImportant,
    setReplyingTo,
    onForward,
    handleEditClick,
    togglePin,
    onReport,
    handleDelete
}) {

    const { t } = useTranslation();


    return (
        <div className="flex items-center gap-[6px] opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                type="button"
                onClick={onToggleImportant}
                title={t('chat.viewer.mark_important')}
                className={`bg-transparent border-none p-0 cursor-pointer flex items-center ${
                    msg.is_important ? 'text-[#e6a100]' : 'text-text-muted hover:text-theme-link'
                }`}
            >
                <StarSvg filled={Boolean(msg.is_important)} />
            </button>

            <button
                type="button"
                onClick={() => setReplyingTo(msg)}
                title={t('chat.viewer.reply')}
                className="bg-transparent border-none p-0 text-text-muted hover:text-theme-link cursor-pointer flex items-center"
            >
                <ReplySvg />
            </button>

            <button
                type="button"
                onClick={onForward}
                title={t('chat.viewer.forward')}
                className="bg-transparent border-none p-0 text-text-muted hover:text-theme-link cursor-pointer flex items-center"
            >
                <ForwardSvg />
            </button>

            {msg.isMine && !msg.isPureForward && (
                <button
                    type="button"
                    onClick={() => handleEditClick(msg)}
                    title={t('chat.viewer.edit')}
                    className="bg-transparent border-none p-0 text-text-muted hover:text-theme-link cursor-pointer flex items-center"
                >
                    <EditSvg />
                </button>
            )}

            <button
                type="button"
                onClick={() => togglePin(msg.uuid)}
                title={t('chat.viewer.pin')}
                className={`bg-transparent border-none p-0 cursor-pointer flex items-center ${
                    msg.is_pinned ? 'text-theme-link' : 'text-text-muted hover:text-theme-link'
                }`}
            >
                <PinSvg />
            </button>

            {!msg.isMine && (
                <button
                    type="button"
                    onClick={onReport}
                    title={t('chat.viewer.report')}
                    className="bg-transparent border-none p-0 text-text-muted hover:text-theme-error cursor-pointer flex items-center"
                >
                    <FlagSvg />
                </button>
            )}

            <button
                type="button"
                onClick={() => handleDelete(msg.uuid)}
                title={t('chat.viewer.delete')}
                className="bg-transparent border-none p-0 text-text-muted hover:text-theme-error cursor-pointer flex items-center"
            >
                <TrashSvg />
            </button>
        </div>
    );
}