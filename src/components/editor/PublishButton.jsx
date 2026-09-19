import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useOnClickOutside from './hooks/useOnClickOutside';
import Checkbox from "../ui/Checkbox.jsx";
import Button from '../ui/Button.jsx';
import { ClockIcon } from '../ui/Icons';

const getDefaultScheduleDate = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 10);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function PublishButton({ onPublish, onSchedule, isSubmitting }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(getDefaultScheduleDate);
    const [canComment, setCanComment] = useState(true);
    const ref = useRef(null);

    useOnClickOutside(ref, () => setIsOpen(false));

    const handleSchedule = () => {
        if (!scheduleDate) return;
        const dateObj = new Date(scheduleDate);
        const utcIsoString = dateObj.toISOString();
        onSchedule(utcIsoString, canComment);
        setIsOpen(false);
    };

    const handlePublishClick = () => {
        onPublish(canComment);
    };

    const baseBtnClass = "bg-btn-primary text-btn-primary-text cursor-pointer flex items-center justify-center transition-colors hover:bg-btn-primary-hover outline-none disabled:opacity-50 disabled:cursor-not-allowed m-0 border-none font-tahoma";

    return (
        <div className="relative inline-flex items-center h-[28px] shrink-0" ref={ref}>
            <Button
                type="button"
                onClick={handlePublishClick}
                disabled={isSubmitting}
                className={`${baseBtnClass} !rounded-none !shadow-none px-[12px] font-bold text-[12px] h-[28px] min-h-[28px] py-0`}
            >
                {isSubmitting ? t('editor.publishing') : t('editor.publish')}
            </Button>

            <div className="w-[1px] bg-[rgba(255,255,255,0.2)] h-[28px]"></div>

            <Button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isSubmitting}
                className={`${baseBtnClass} !rounded-none !shadow-none w-[28px] p-0 h-[28px] min-h-[28px]`}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M6 9l6 6 6-6" /></svg>
            </Button>

            {isOpen && (
                <div className="absolute top-[100%] right-0 mt-[6px] p-[10px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] z-[100] min-w-[220px]">
                    <div className="text-[11px] font-bold text-text-main mb-[8px] border-b border-border pb-[4px]">
                        {t('editor.schedule_title')}
                    </div>

                    <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] outline-none focus:border-theme-link mb-[10px] font-tahoma"
                    />

                    <div className="mb-[10px]">
                        <Checkbox
                            checked={canComment}
                            onChange={(e) => setCanComment(e.target.checked)}
                            label={t('post.allow_comments')}
                        />
                    </div>

                    <Button
                        type="button"
                        className="w-full bg-btn-primary text-btn-primary-text py-[6px] font-bold text-[11px] cursor-pointer hover:bg-btn-primary-hover border-none outline-none m-0 !rounded-none !shadow-none"
                        onClick={handleSchedule}
                    >
                        {t('editor.schedule_confirm')}
                    </Button>
                </div>
            )}
        </div>
    );
}