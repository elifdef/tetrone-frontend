import { createContext, useContext, type ReactNode } from 'react';

export interface ModalContextValue {
    openConfirm: (
        message: ReactNode,
        title?: ReactNode,
        btnYes?: string,
        btnNo?: string
    ) => Promise<boolean>;
    openPrompt: (
        message: ReactNode,
        title?: ReactNode,
        placeholder?: string,
        allowEmpty?: boolean,
        btnSubmit?: string,
        btnCancel?: string
    ) => Promise<string | null>;
    openPassword: (
        message?: ReactNode,
        title?: ReactNode,
        btnSubmit?: string
    ) => Promise<string | null>;
    openCustom: <T = unknown>(customContent: ReactNode) => Promise<T>;
    closeModal: () => void;
}

export const ModalContext = createContext<ModalContextValue>({
    openConfirm: async () => false,
    openPrompt: async () => null,
    openPassword: async () => null,
    openCustom: async () => undefined as never,
    closeModal: () => {},
});

export const useModal = () => useContext(ModalContext);
