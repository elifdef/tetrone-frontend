import { useState, useCallback, type ReactNode } from 'react';
import { ModalContext } from './modal-context';
import ConfirmModal from '@/components/modals/ConfirmModal';
import PromptModal from '@/components/modals/PromptModal';
import i18n from '@/i18n';

type ActiveModalState =
    | { isOpen: false }
    | {
          isOpen: true;
          type: 'confirm';
          title: ReactNode;
          message: ReactNode;
          btnSubmit: string;
          btnCancel: string;
          resolve: (confirmed: boolean) => void;
      }
    | {
          isOpen: true;
          type: 'prompt' | 'password';
          title: ReactNode;
          message: ReactNode;
          placeholder: string;
          inputValue: string;
          btnSubmit: string;
          btnCancel: string;
          allowEmptyPrompt: boolean;
          resolve: (value: string | null) => void;
      }
    | {
          isOpen: true;
          type: 'custom';
          customContent: ReactNode;
          resolve: (value: unknown) => void;
      };

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
    const [modalState, setModalState] = useState<ActiveModalState>({ isOpen: false });

    const closeAndReset = useCallback(() => {
        setModalState({ isOpen: false });
    }, []);

    const openConfirm = useCallback(
        (
            message: ReactNode,
            title: ReactNode = i18n.t('action.confirm'),
            btnYes: string = i18n.t('common.yes'),
            btnNo: string = i18n.t('action.cancel')
        ) => {
            return new Promise<boolean>((resolve) => {
                setModalState({
                    isOpen: true,
                    type: 'confirm',
                    title,
                    message,
                    btnSubmit: btnYes,
                    btnCancel: btnNo,
                    resolve,
                });
            });
        },
        []
    );

    const openPrompt = useCallback(
        (
            message: ReactNode,
            title: ReactNode = i18n.t('common.input_required'),
            placeholder = '',
            allowEmpty = false,
            btnSubmit: string = i18n.t('action.save'),
            btnCancel: string = i18n.t('action.cancel')
        ) => {
            return new Promise<string | null>((resolve) => {
                setModalState({
                    isOpen: true,
                    type: 'prompt',
                    title,
                    message,
                    placeholder,
                    allowEmptyPrompt: allowEmpty,
                    btnSubmit,
                    btnCancel,
                    resolve,
                    inputValue: '',
                });
            });
        },
        []
    );

    const openPassword = useCallback(
        (
            message: ReactNode = i18n.t('error.enter_confirm_password'),
            title: ReactNode = i18n.t('common.security'),
            btnSubmit: string = i18n.t('action.confirm')
        ) => {
            return new Promise<string | null>((resolve) => {
                setModalState({
                    isOpen: true,
                    type: 'password',
                    title,
                    message,
                    placeholder: '********',
                    allowEmptyPrompt: false,
                    btnSubmit,
                    btnCancel: i18n.t('action.cancel'),
                    resolve,
                    inputValue: '',
                });
            });
        },
        []
    );

    const openCustom = useCallback(<T = unknown>(customContent: ReactNode) => {
        return new Promise<T>((resolve) => {
            setModalState({
                isOpen: true,
                type: 'custom',
                resolve: resolve as (value: unknown) => void,
                customContent,
            });
        });
    }, []);

    return (
        <ModalContext.Provider
            value={{
                openConfirm,
                openPrompt,
                openPassword,
                openCustom,
                closeModal: closeAndReset,
            }}
        >
            {children}

            {modalState.isOpen && modalState.type === 'confirm' && (
                <ConfirmModal
                    isOpen={modalState.isOpen}
                    onClose={closeAndReset}
                    onResolve={modalState.resolve}
                    title={modalState.title}
                    message={modalState.message}
                    btnSubmit={modalState.btnSubmit}
                    btnCancel={modalState.btnCancel}
                />
            )}

            {modalState.isOpen &&
                (modalState.type === 'prompt' || modalState.type === 'password') && (
                    <PromptModal
                        isOpen={modalState.isOpen}
                        onClose={closeAndReset}
                        onResolve={modalState.resolve}
                        isPassword={modalState.type === 'password'}
                        title={modalState.title}
                        message={modalState.message}
                        placeholder={modalState.placeholder}
                        inputValue={modalState.inputValue}
                        setInputValue={(val) =>
                            setModalState((prev) =>
                                prev.isOpen &&
                                (prev.type === 'prompt' || prev.type === 'password')
                                    ? { ...prev, inputValue: val }
                                    : prev
                            )
                        }
                        btnSubmit={modalState.btnSubmit}
                        btnCancel={modalState.btnCancel}
                        allowEmptyPrompt={modalState.allowEmptyPrompt}
                    />
                )}

            {modalState.isOpen && modalState.type === 'custom' && modalState.customContent}
        </ModalContext.Provider>
    );
};
