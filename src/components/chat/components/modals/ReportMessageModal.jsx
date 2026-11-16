import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@ui/Button';
import Modal from '@components/modals/Modal.jsx';

export default function ReportMessageModal({
    isOpen,
    onClose,
    onSubmit
}) {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onSubmit(reason);
        setReason('');
        onClose();
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={t('chat.modals.report_title')}
            sizeClass="modal-sm"
            bodyClassName="p-[15px]"
        >
            <div className="flex flex-col gap-[10px] text-[11px]">
                <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('chat.modals.report_placeholder')}
                    className="w-full p-[6px] bg-bg-box border border-border text-text-main outline-none"
                />
                <div className="flex justify-end gap-[8px]">
                    <Button variant="secondary" onClick={onClose}>
                        {t('chat.actions.cancel')}
                    </Button>
                    <Button variant="danger" onClick={handleConfirm}>
                        {t('chat.modals.submit_report')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}