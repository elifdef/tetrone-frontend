import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Modal from './Modal';

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResolve: (confirmed: boolean) => void;
    title?: ReactNode;
    message?: ReactNode;
    btnSubmit?: string;
    btnCancel?: string;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onResolve,
    title,
    message,
    btnSubmit,
    btnCancel,
}: ConfirmModalProps) {
    const { t } = useTranslation();

    const handleCancel = () => {
        onResolve(false);
        onClose();
    };

    const handleSubmit = () => {
        onResolve(true);
        onClose();
    };

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={handleCancel}>
                {btnCancel || t('action.cancel')}
            </Button>
            <Button onClick={handleSubmit}>
                {btnSubmit || t('action.confirm')}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            title={title || t('common.confirmation')}
            sizeClass="modal-sm"
            footer={footerButtons}
        >
            <div className="text-[12px] leading-[1.5] m-0 mb-[15px]">
                {message}
            </div>
        </Modal>
    );
}