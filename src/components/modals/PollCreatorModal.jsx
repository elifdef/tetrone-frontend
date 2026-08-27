import React from 'react';
import { useTranslation } from 'react-i18next';
import PollCreator from '../post/components/PollCreator';
import Modal from './Modal';

export default function PollCreatorModal({ isOpen, onClose, pollData, onSave }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('poll.create_title')}
            sizeClass="modal-md"
        >
            <PollCreator
                initialData={pollData}
                onSave={onSave}
                onCancel={onClose}
            />
        </Modal>
    );
}