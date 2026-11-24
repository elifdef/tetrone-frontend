import { useTranslation } from 'react-i18next';
import Button from '@ui/Button';
import Modal from '@components/modals/Modal.jsx';

export interface JumpToDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string;
    onChangeDate: (date: string) => void;
    onJump: () => void;
}

export default function JumpToDateModal({
    isOpen,
    onClose,
    selectedDate,
    onChangeDate,
    onJump,
}: JumpToDateModalProps) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={t('chat.viewer.select_date_title')}
            sizeClass="modal-sm"
            bodyClassName="p-[15px]"
        >
            <div className="flex flex-col gap-[10px] text-[11px]">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onChangeDate(e.target.value)}
                    className="p-[6px] bg-bg-box border border-border text-text-main outline-none"
                />
                <div className="flex justify-end gap-[8px]">
                    <Button variant="secondary" onClick={onClose}>
                        {t('chat.actions.cancel')}
                    </Button>
                    <Button variant="primary" onClick={onJump}>
                        {t('chat.modals.jump_to_date')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}