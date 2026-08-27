import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useOnClickOutside from './hooks/useOnClickOutside';

export default function PublishButton({ onPublish, onSchedule, isSubmitting }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const ref = useRef(null);

    useOnClickOutside(ref, () => setIsOpen(false));

    const handleSchedule = () => {
        if (!scheduleDate) return;
        onSchedule(scheduleDate);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-flex items-stretch shadow-sm rounded-[2px]" ref={ref}>
            <button
                type="button"
                onClick={onPublish}
                disabled={isSubmitting}
                className="bg-btn-primary text-btn-primary-text font-bold text-[11px] py-[6px] px-[16px] border border-btn-primary-border rounded-l-[2px] cursor-pointer transition-colors hover:bg-btn-primary-hover disabled:opacity-50 disabled:cursor-not-allowed m-0"
            >
                {isSubmitting ? t('editor.publishing') : t('editor.publish')}
            </button>

            <div className="w-[1px] bg-btn-primary-border"></div>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isSubmitting}
                className="bg-btn-primary text-btn-primary-text border border-btn-primary-border border-l-0 rounded-r-[2px] px-[6px] cursor-pointer flex items-center justify-center transition-colors hover:bg-btn-primary-hover disabled:opacity-50 m-0"
                title={t('editor.schedule_post')}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-[2px] p-[8px] bg-bg-box border border-border shadow-sm rounded-[2px] z-[100] min-w-[200px]">
                    <div className="text-[11px] font-bold text-text-main mb-[6px] border-b border-border pb-[4px]">
                        {t('editor.schedule_title')}
                    </div>

                    <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-input-bg border border-input-border text-text-main p-[4px] text-[11px] rounded-[2px] outline-none focus:border-theme-link mb-[8px]"
                    />

                    <button
                        type="button"
                        className="w-full bg-btn-primary text-btn-primary-text py-[4px] rounded-[2px] text-[11px] font-bold border border-btn-primary-border cursor-pointer hover:bg-btn-primary-hover m-0"
                        onClick={handleSchedule}
                    >
                        {t('editor.schedule_confirm')}
                    </button>
                </div>
            )}
        </div>
    );
}