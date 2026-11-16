import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../ui/Button';
import Modal from '../../../modals/Modal.jsx';

export default function GraffitiModal({ isOpen, onClose, onSave }) {
    const { t } = useTranslation();
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);

    if (!isOpen) return null;

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        isDrawingRef.current = true;
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#2b587a';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        onSave?.(dataUrl);
        onClose();
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={t('chat.composer.attach.graffiti')}
            sizeClass="modal-md"
            bodyClassName="p-[15px]"
        >
            <div className="flex flex-col items-center gap-[10px]">
                <canvas
                    ref={canvasRef}
                    width={360}
                    height={220}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="border border-border bg-white cursor-crosshair"
                />
                <div className="flex justify-end gap-[8px] w-full text-[11px]">
                    <Button variant="secondary" onClick={onClose}>
                        {t('chat.actions.cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        {t('chat.actions.save')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}