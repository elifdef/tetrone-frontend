import { useTranslation } from 'react-i18next';
import Modal from '../modals/Modal.jsx';

export default function ImagePreviewModal({ isOpen, onClose, imageUrl }) {
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('support.image_preview')}
            sizeClass="modal-lg"
            bodyClassName="p-[10px] flex items-center justify-center bg-[rgba(128,128,128,0.02)]"
        >
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-[75vh] object-contain border border-border shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                />
            )}
        </Modal>
    );
}