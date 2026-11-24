import { useCallback, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../ui/Icons';

export interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    onCloseRequest?: () => void;
    preventOutsideClose?: boolean;
    title?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    sizeClass?: 'modal-sm' | 'modal-md' | 'modal-lg' | 'modal-xl' | 'modal-full' | string;
    dialogClassName?: string;
    bodyClassName?: string;
    hideHeader?: boolean;
}

export default function Modal({
    isOpen,
    onClose,
    onCloseRequest,
    preventOutsideClose = false,
    title,
    children,
    footer,
    sizeClass = 'modal-md',
    dialogClassName = '',
    bodyClassName = '',
    hideHeader = false,
}: ModalProps) {
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => document.body.classList.remove('overflow-hidden');
    }, [isOpen]);

    const handleAttemptClose = useCallback(() => {
        if (preventOutsideClose) {
            if (onCloseRequest) onCloseRequest();
            return;
        }
        if (onClose) onClose();
    }, [preventOutsideClose, onCloseRequest, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleAttemptClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleAttemptClose]);

    if (!isOpen) return null;

    let widthClass = 'w-[500px]';
    if (sizeClass === 'modal-sm') widthClass = 'w-[350px]';
    if (sizeClass === 'modal-lg') widthClass = 'w-[700px]';
    if (sizeClass === 'modal-xl') widthClass = 'w-[1150px]';
    if (sizeClass === 'modal-full') widthClass = 'w-[96vw] max-w-[1440px]';

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-[20px] max-md:p-[10px] overflow-y-auto"
            onMouseDown={handleAttemptClose}
        >
            <div
                className={`bg-bg-box shadow-[0_2px_10px_rgba(0,0,0,0.3)] ${widthClass} max-w-full flex flex-col text-text-main m-auto font-tahoma text-[11px] max-md:w-full ${dialogClassName}`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {!hideHeader && (
                    <div className="shrink-0 bg-modal-header-bg text-modal-header-text border-b border-border py-[8px] px-[12px] flex justify-between items-center">
                        {title ? <h3 className="m-0 text-[12px] font-bold text-modal-header-text">{title}</h3> : <div />}
                        <button
                            type="button"
                            className="bg-transparent border-none text-modal-header-text text-[14px] leading-none cursor-pointer p-0 opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center outline-none"
                            onClick={() => {
                                if (onCloseRequest && preventOutsideClose) onCloseRequest();
                                else if (onClose) onClose();
                            }}
                            title={t('action.close')}
                        >
                            <CloseIcon width={14} height={14} />
                        </button>
                    </div>
                )}

                <div className={`flex-1 min-h-0 p-[15px] overflow-y-auto bg-bg-box ${bodyClassName}`}>
                    {children}
                </div>

                {footer && (
                    <div className="shrink-0 bg-bg-page border-t border-border py-[10px] px-[15px] flex justify-end items-center gap-[10px]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}