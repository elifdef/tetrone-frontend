import { useTranslation } from 'react-i18next';
import { ImageIcon, VideoIcon, AudioIcon, DocumentIcon } from '../../ui/Icons';

export default function AttachBar({ onFileSelect }) {
    const { t } = useTranslation();

    const btnClass = "text-text-muted transition-all duration-200 flex items-center justify-center bg-transparent border-none cursor-pointer hover:text-theme-link hover:scale-110";

    return (
        <div className="flex items-center gap-[12px]">
            <label className={btnClass} title={t('action.attach_image')}>
                <input type="file" multiple className="hidden" onChange={onFileSelect} accept="image/*" />
                <ImageIcon />
            </label>

            <label className={btnClass} title={t('action.attach_video')}>
                <input type="file" multiple className="hidden" onChange={onFileSelect} accept="video/*" />
                <VideoIcon />
            </label>

            <label className={btnClass} title={t('action.attach_audio')}>
                <input type="file" multiple className="hidden" onChange={onFileSelect} accept="audio/*" />
                <AudioIcon />
            </label>

            <label className={btnClass} title={t('action.attach_document')}>
                <input type="file" multiple className="hidden" onChange={onFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" />
                <DocumentIcon />
            </label>
        </div>
    );
}