import {useEffect} from "react";
import {useTranslation} from "react-i18next";
import "./Modal.css";
import {CloseIcon} from "../ui/Icons.jsx";

export default function Modal(
    {
        isOpen,
        onClose,
        title,
        children,
        footer,
        sizeClass = "", // 'modal-sm', 'modal-md', 'modal-lg'
        dialogClassName = "", // Для додаткових кастомних класів вікна
        bodyClassName = "", // Для кастомних відступів всередині body
        hideHeader = false // На випадок, якщо треба повністю нестандартна шапка (як у PhotoModal)
    })
{
    const {t} = useTranslation();

    useEffect(() =>
    {
        if (isOpen)
        {
            document.body.classList.add('modal-open');
        } else
        {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    useEffect(() =>
    {
        if (!isOpen) return;
        const handleKeyDown = (e) =>
        {
            if (e.key === 'Escape' && onClose)
            {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="tetrone-modal-overlay" onMouseDown={onClose}>
            <div
                className={`tetrone-modal-dialog ${sizeClass} ${dialogClassName}`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {!hideHeader && (
                    <div className="tetrone-modal-header">
                        {title ? <h3>{title}</h3> : <div></div>}
                        <button
                            className="tetrone-modal-close"
                            onClick={onClose}
                            title={t('action.close')}
                        >
                            <CloseIcon/>
                        </button>
                    </div>
                )}

                <div className={`tetrone-modal-body ${bodyClassName}`}>
                    {children}
                </div>

                {footer && (
                    <div className="tetrone-modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}