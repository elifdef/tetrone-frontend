import { useTranslation } from 'react-i18next';
import Modal from './Modal.jsx';
import Button from '../ui/Button.jsx';

const InfoRow = ({ label, children }) => (
    <div className="flex justify-between items-center py-[6px] border-b border-dashed border-border last:border-b-0 text-[11px]">
        <span className="text-text-muted">
            {label}:
        </span>
        <div className="font-bold text-text-main text-right ml-[10px]">
            {children}
        </div>
    </div>
);

const ReasonBox = ({ label, text, isError }) => {
    if (!text) return null;
    const borderColorClass = isError ? 'border-theme-error' : 'border-theme-success';
    const textColorClass = isError ? 'text-theme-error' : 'text-theme-success';

    return (
        <div className={`mt-[15px] p-[10px] border bg-[rgba(128,128,128,0.05)] ${borderColorClass}`}>
            <div className={`font-bold text-[11px] mb-[4px] ${textColorClass}`}>
                {label}:
            </div>
            <div className="text-[11px] text-text-main leading-[1.4]">{text}</div>
        </div>
    );
};

export default function ReportResultModal({ payload, onClose }) {
    const { t } = useTranslation();

    if (!payload) return null;

    const { type, actor = {}, target = {} } = payload;

    let moderatorLabel = t('reports.system_moderator');
    if (actor.first_name && actor.first_name !== 'System') {
        const fullName = `${actor.first_name} ${actor.last_name || ''}`.trim();
        const roleName = t(`roles.${actor.role}`);
        moderatorLabel = `${fullName} (${roleName})`;
    }

    const contentTypeKey = target.reported_type || target.target_type;

    let contentDisplay = target.reported_content;
    if (!contentDisplay && target.has_media) {
        contentDisplay = `[${t('reports.media_content')}]`;
    } else if (!contentDisplay) {
        contentDisplay = t('reports.content_unavailable');
    }

    const footerButtons = (
        <Button variant="secondary" onClick={onClose}>{t('action.close')}</Button>
    );

    if (type === 'content_deleted' || type === 'content_restored') {
        const isDeleted = type === 'content_deleted';

        return (
            <Modal
                isOpen={true}
                onClose={onClose}
                title={isDeleted ? t('reports.content_deleted_title') : t('reports.content_restored_title')}
                footer={footerButtons}
            >
                <div className="bg-bg-page border border-border p-[10px]">
                    <InfoRow label={t('reports.moderator_label')}>
                        <span>{moderatorLabel}</span>
                    </InfoRow>

                    <InfoRow label={t('reports.deleted_type_label')}>
                        <strong>{t(`reports.reported_${contentTypeKey}`)}</strong>
                    </InfoRow>

                    <div className="py-[6px] border-b border-dashed border-border last:border-b-0 text-[11px] flex flex-col">
                        <span className="text-text-muted mb-[4px]">
                            {t('reports.content_label')}:
                        </span>
                        <div className="italic text-text-muted text-[11px] border-l-[2px] border-border pl-[8px] whitespace-pre-line leading-[1.4]">
                            "{contentDisplay}"
                        </div>
                    </div>
                </div>

                <ReasonBox
                    label={isDeleted ? t('reports.moderator_response') : t('reports.revert_reason_label')}
                    text={target.reason}
                    isError={isDeleted}
                />
            </Modal>
        );
    }

    if (type === 'report_reviewed' || type === 'report_reverted') {
        const isReverted = type === 'report_reverted';
        const isResolved = target.report_status === 'resolved';

        return (
            <Modal
                isOpen={true}
                onClose={onClose}
                title={isReverted ? t('reports.report_reverted_title') : t('reports.review_result_title')}
                footer={footerButtons}
            >
                <div className="bg-bg-page border border-border p-[10px]">
                    <InfoRow label={t('reports.status_label')}>
                        {isReverted ? (
                            <span className="text-[#e5a43b]">{t('reports.status_pending_again')}</span>
                        ) : (
                            <span className={isResolved ? 'text-theme-success' : 'text-theme-error'}>
                                {isResolved ? t('reports.status_deleted') : t('reports.status_kept')}
                            </span>
                        )}
                    </InfoRow>

                    <InfoRow label={t('reports.moderator_label')}>
                        <span>{moderatorLabel}</span>
                    </InfoRow>

                    <InfoRow label={t('reports.deleted_type_label')}>
                        <strong>{t(`reports.reported_${contentTypeKey}`)}</strong>
                    </InfoRow>

                    <div className="py-[6px] border-b border-dashed border-border last:border-b-0 text-[11px] flex flex-col">
                        <span className="text-text-muted mb-[4px]">
                            {t('reports.content_label')}:
                        </span>
                        <div className="italic text-text-muted text-[11px] border-l-[2px] border-border pl-[8px] whitespace-pre-line leading-[1.4]">
                            "{contentDisplay}"
                        </div>
                    </div>
                </div>

                <ReasonBox
                    label={isReverted ? t('reports.revert_reason_label') : t('reports.moderator_response')}
                    text={target.reason || target.preview_text}
                    isError={!isReverted}
                />
            </Modal>
        );
    }

    return null;
}