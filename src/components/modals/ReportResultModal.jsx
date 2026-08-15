import {useTranslation} from 'react-i18next';
import Modal from './Modal.jsx';
import Button from '../ui/Button.jsx';
import './ReportResultModal.css';

const InfoRow = ({label, children}) => (
    <div className="tetrone-report-info-row">
        <span className="tetrone-report-label">
            {label}:
        </span>
        {children}
    </div>
);

const ReasonBox = ({label, text, isError}) =>
{
    if (!text) return null;
    return (
        <div className="tetrone-report-reason-box">
            <div className={`tetrone-report-reason-label ${isError ? 'error-text' : 'success-text'}`}>
                {label}:
            </div>
            <div className="tetrone-report-reason-text">{text}</div>
        </div>
    );
};

export default function ReportResultModal({payload, onClose})
{
    const {t} = useTranslation();

    if (!payload) return null;

    const {type, actor = {}, target = {}} = payload;

    let moderatorLabel = t('reports.system_moderator');
    if (actor.first_name && actor.first_name !== 'System')
    {
        const fullName = `${actor.first_name} ${actor.last_name || ''}`.trim();
        const roleName = t(`roles.${actor.role}`);
        moderatorLabel = `${fullName} (${roleName})`;
    }

    const contentTypeKey = target.reported_type || target.target_type;

    let contentDisplay = target.reported_content;
    if (!contentDisplay && target.has_media)
    {
        contentDisplay = `[${t('reports.media_content')}]`;
    } else if (!contentDisplay)
    {
        contentDisplay = t('reports.content_unavailable');
    }

    const footerButtons = (
        <Button variant="secondary" onClick={onClose}>{t('action.close')}</Button>
    );

    if (type === 'content_deleted' || type === 'content_restored')
    {
        const isDeleted = type === 'content_deleted';

        return (
            <Modal
                isOpen={true}
                onClose={onClose}
                title={isDeleted ? t('reports.content_deleted_title') : t('reports.content_restored_title')}
                footer={footerButtons}
            >
                <div className="tetrone-info-block">
                    <InfoRow label={t('reports.moderator_label')}>
                        <span className="tetrone-value">{moderatorLabel}</span>
                    </InfoRow>

                    <InfoRow label={t('reports.deleted_type_label')}>
                        <strong className="tetrone-value">{t(`reports.reported_${contentTypeKey}`)}</strong>
                    </InfoRow>

                    <div className="tetrone-report-info-row">
                        <span className="tetrone-report-label block-label">
                            {t('reports.content_label')}:
                        </span>
                        <div className="tetrone-settings-quote">
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

    if (type === 'report_reviewed' || type === 'report_reverted')
    {
        const isReverted = type === 'report_reverted';
        const isResolved = target.report_status === 'resolved';

        return (
            <Modal
                isOpen={true}
                onClose={onClose}
                title={isReverted ? t('reports.report_reverted_title') : t('reports.review_result_title')}
                footer={footerButtons}
            >
                <div className="tetrone-info-block">
                    <InfoRow label={t('reports.status_label')}>
                        {isReverted ? (
                            <strong className="tetrone-value admin-status-orange">{t('reports.status_pending_again')}</strong>
                        ) : (
                            <strong className={`tetrone-value ${isResolved ? 'admin-status-green' : 'admin-status-red'}`}>
                                {isResolved ? t('reports.status_deleted') : t('reports.status_kept')}
                            </strong>
                        )}
                    </InfoRow>

                    <InfoRow label={t('reports.moderator_label')}>
                        <span className="tetrone-value">{moderatorLabel}</span>
                    </InfoRow>

                    <InfoRow label={t('reports.deleted_type_label')}>
                        <strong className="tetrone-value">{t(`reports.reported_${contentTypeKey}`)}</strong>
                    </InfoRow>

                    <div className="tetrone-report-info-row">
                        <span className="tetrone-report-label block-label">
                            {t('reports.content_label')}:
                        </span>
                        <div className="tetrone-settings-quote">
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