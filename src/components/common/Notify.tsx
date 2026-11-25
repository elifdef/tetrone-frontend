import type { ReactNode } from 'react';
import toast, { type ToastOptions } from 'react-hot-toast';
import i18next from 'i18next';
import InfoIcon from '../../assets/info.svg?react';
import SuccessIcon from '../../assets/success.svg?react';
import ErrorIcon from '../../assets/error.svg?react';
import WarningIcon from '../../assets/warning.svg?react';
import LoadingIcon from '../../assets/loader.svg?react';
import { ClassicToastBox, type ToastVariant } from './ClassicToastBox';

const toastOptions: ToastOptions = {
    duration: 4000,
    position: 'bottom-right',
    style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
        borderRadius: 0,
    },
};

const renderToast = (
    message: ReactNode,
    icon: ReactNode,
    variant: ToastVariant,
    titleKey: string,
    customOptions?: ToastOptions
): string => {
    toast.dismiss();
    const title = i18next.isInitialized ? i18next.t(titleKey) : titleKey;
    return toast(
        (t) => (
            <ClassicToastBox
                t={t}
                variant={variant}
                title={title}
                message={message}
                icon={icon}
            />
        ),
        {
            ...toastOptions,
            ...customOptions,
        }
    );
};

export const notifyInfo = (message: ReactNode): string =>
    renderToast(
        message,
        <InfoIcon width={18} height={18} fill="#597da3" />,
        'info',
        'common.notifications'
    );

export const notifySuccess = (message: ReactNode): string =>
    renderToast(
        message,
        <SuccessIcon width={18} height={18} fill="#4bb34b" />,
        'success',
        'common.success'
    );

export const notifyError = (message: ReactNode): string =>
    renderToast(
        message,
        <ErrorIcon width={18} height={18} fill="#d93848" />,
        'error',
        'common.error'
    );

export const notifyWarn = (message: ReactNode): string =>
    renderToast(
        message,
        <WarningIcon width={18} height={18} fill="#e0a800" />,
        'warn',
        'common.notifications'
    );

export const notifyLoading = (message?: string): string => {
    const text = message || i18next.t('common.processing');
    return renderToast(
        text,
        <LoadingIcon width={18} height={18} fill="#597da3" className="animate-spin" />,
        'loading',
        'common.processing',
        { duration: Infinity }
    );
};

export const dismissToast = (toastId?: string): void => {
    toast.dismiss(toastId);
};