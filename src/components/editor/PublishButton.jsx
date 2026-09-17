import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useOnClickOutside from './hooks/useOnClickOutside';
import Button from "../ui/Button.jsx";
import Checkbox from "../ui/Checkbox.jsx";

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
        
        // Перетворюємо локальний рядок (YYYY-MM-DDTHH:mm) у стандартний UTC (ISO 8601)
        const dateObj = new Date(scheduleDate);
        const utcIsoString = dateObj.toISOString(); 

        onSchedule(utcIsoString, canComment);
        setIsOpen(false);
    };

    const handlePublishClick = () => {
        onPublish(canComment);
    };

    return (
        <div className="relative inline-flex items-stretch shadow-sm" ref={ref}>
            <Button
                onClick={handlePublishClick}
                disabled={isSubmitting}
            >
                {isSubmitting ? t('editor.publishing') : t('editor.publish')}
            </Button>

            <div className="w-[1px] bg-btn-primary-border"></div>

            <Button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isSubmitting}
                className="border-l-0 cursor-pointer flex items-center justify-center disabled:opacity-50 m-0"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </Button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-[2px] p-[10px] bg-bg-box border border-border shadow-sm z-[100] min-w-[220px]">
                    <div className="text-[11px] font-bold text-text-main mb-[8px] border-b border-border pb-[4px]">
                        {t('editor.schedule_title')}
                    </div>

                    <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] rounded-[2px] outline-none focus:border-theme-link mb-[10px] font-tahoma"
                    />

                    <div className="mb-[10px]">
                        <Checkbox 
                            checked={canComment} 
                            onChange={(e) => setCanComment(e.target.checked)} 
                            label={t('post.allow_comments')} 
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSchedule}
                    >
                        {t('editor.schedule_confirm')}
                    </Button>
                </div>
            )}
        </div>
    );
}