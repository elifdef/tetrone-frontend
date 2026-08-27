import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "../ui/Icons.jsx";

export default function Modal({
                                  isOpen,
                                  onClose,
                                  title,
                                  children,
                                  footer,
                                  sizeClass = "modal-md",
                                  dialogClassName = "",
                                  bodyClassName = "",
                                  hideHeader = false
                              }) {
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => document.body.classList.remove('overflow-hidden');
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    let widthClass = "w-[500px]";
    if (sizeClass === "modal-sm") widthClass = "w-[350px]";
    if (sizeClass === "modal-lg") widthClass = "w-[700px]";

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-[20px] max-md:p-[10px] overflow-y-auto"
            onMouseDown={onClose}
        >
            {/* ФІКС: border-border замість #555 */}
            <div
                className={`bg-bg-box shadow-[0_2px_10px_rgba(0,0,0,0.3)] ${widthClass} max-w-full flex flex-col text-text-main m-auto font-tahoma text-[11px] max-md:w-full ${dialogClassName}`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {!hideHeader && (
                    <div className="bg-modal-header-bg text-modal-header-text border-b border-border py-[8px] px-[12px] flex justify-between items-center">
                        {title ? <h3 className="m-0 text-[12px] font-bold text-modal-header-text">{title}</h3> : <div></div>}
                        <button
                            className="bg-transparent border-none text-modal-header-text text-[14px] leading-none cursor-pointer p-0 opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center outline-none"
                            onClick={onClose}
                            title={t('action.close')}
                        >
                            <CloseIcon width={14} height={14} />
                        </button>
                    </div>
                )}

                <div className={`p-[15px] overflow-y-auto bg-bg-box ${bodyClassName}`}>
                    {children}
                </div>

                {footer && (
                    <div className="bg-bg-page border-t border-border py-[10px] px-[15px] flex justify-end items-center gap-[10px]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}