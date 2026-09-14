import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import Modal from "./Modal";

export default function PromptModal(
    {
        isOpen,
        onClose,
        onResolve,
        isPassword = false,
        title,
        message,
        placeholder,
        inputValue,
        setInputValue,
        btnSubmit,
        btnCancel,
        allowEmptyPrompt = false
    }) {
    const { t } = useTranslation();
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleCancel = () => {
        onResolve(null);
        onClose();
    };

    const handleSubmit = () => {
        onResolve(inputValue);
        onClose();
    };

    const isSubmitDisabled = !allowEmptyPrompt && !inputValue.trim();

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isSubmitDisabled) {
            handleSubmit();
        }
    };

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={handleCancel}>
                {btnCancel || t('action.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                {btnSubmit || t('action.submit')}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            title={title || t('common.input_required')}
            sizeClass="modal-sm"
            footer={footerButtons}
            preventOutsideClose={true} // ФІКС: Забороняємо закривати по фону
        >
            {message && <div className="mb-[12px] text-[11px] text-text-main leading-[1.4]">{message}</div>}

            <div className={isPassword ? "relative w-full" : "w-full"}>
                <input
                    ref={inputRef}
                    type={isPassword ? "password" : "text"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full !rounded-none bg-input-bg border border-input-border p-[4px_6px] text-[11px] text-text-main outline-none focus:border-theme-link transition-colors shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]"
                    placeholder={placeholder || (isPassword ? '********' : '')}
                />
            </div>
        </Modal>
    );
}