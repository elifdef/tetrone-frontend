import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useOnClickOutside from '../../editor/hooks/useOnClickOutside';
import { AttachIcon, ImageIcon, VideoIcon, AudioIcon, DocumentIcon, PollIcon } from '../../ui/Icons';

export default function AttachBar({ onFileSelect, onAddPoll, hasPoll }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useOnClickOutside(ref, () => setIsOpen(false));

    const iconBtnClass = "text-text-muted transition-all duration-200 flex items-center justify-center bg-transparent border-none cursor-pointer hover:text-theme-link hover:scale-110 outline-none";

    return (
        <div className="relative flex items-center" ref={ref}>
            <button
                type="button"
                className={`bg-transparent border-none cursor-pointer p-[6px] flex items-center justify-center outline-none transition-colors ${isOpen ? 'text-theme-link bg-[rgba(0,102,204,0.1)]' : 'text-text-muted hover:text-theme-link hover:bg-[rgba(255,255,255,0.05)]'}`}
                onClick={() => setIsOpen(!isOpen)}
                title={t('editor.attach')}
            >
                <AttachIcon width={18} height={18} />
            </button>

            {isOpen && (
                <div className="absolute top-[100%] mt-[6px] left-0 bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col min-w-[160px] py-[6px] px-[8px] z-[100]">
                    
                    <div className="flex items-center justify-between gap-[12px] p-[6px]">
                        <label className={iconBtnClass} title={t('editor.attach_image')}>
                            <input type="file" multiple className="hidden" onChange={(e) => { onFileSelect(Array.from(e.target.files)); setIsOpen(false); }} accept="image/*" />
                            <ImageIcon width={18} height={18} />
                        </label>
                        <label className={iconBtnClass} title={t('editor.attach_video')}>
                            <input type="file" multiple className="hidden" onChange={(e) => { onFileSelect(Array.from(e.target.files)); setIsOpen(false); }} accept="video/*" />
                            <VideoIcon width={18} height={18} />
                        </label>
                        <label className={iconBtnClass} title={t('editor.attach_audio')}>
                            <input type="file" multiple className="hidden" onChange={(e) => { onFileSelect(Array.from(e.target.files)); setIsOpen(false); }} accept="audio/*" />
                            <AudioIcon width={18} height={18} />
                        </label>
                        <label className={iconBtnClass} title={t('editor.attach_document')}>
                            <input type="file" multiple className="hidden" onChange={(e) => { onFileSelect(Array.from(e.target.files)); setIsOpen(false); }} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" />
                            <DocumentIcon width={18} height={18} />
                        </label>
                    </div>

                    {onAddPoll && !hasPoll && (
                        <>
                            <div className="h-[1px] bg-border my-[6px]"></div>
                            <button 
                                type="button" 
                                className="w-full text-left px-[6px] py-[6px] flex items-center gap-[8px] outline-none cursor-pointer border-none bg-transparent whitespace-nowrap transition-colors text-[11px] text-text-main hover:bg-[rgba(255,255,255,0.05)] hover:text-theme-link"
                                onClick={() => { onAddPoll(); setIsOpen(false); }}
                            >
                                <PollIcon width={16} height={16} /> {t('poll.add_poll')}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}