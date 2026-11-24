import type { ReactNode } from 'react';
import toast, { type Toast, type ToastOptions } from 'react-hot-toast';
import i18next from 'i18next';
import InfoIcon from '../../assets/info.svg?react';
import SuccessIcon from '../../assets/success.svg?react';
import ErrorIcon from '../../assets/error.svg?react';
import WarningIcon from '../../assets/warning.svg?react';
import LoadingIcon from '../../assets/loader.svg?react';

type ToastVariant = 'info' | 'success' | 'error' | 'warn' | 'loading';

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

interface ClassicToastBoxProps {
    t: Toast;
    variant: ToastVariant;
    title: string;
    message: ReactNode;
    icon: ReactNode;
}

const ClassicToastBox = ({ t, variant, title, message, icon }: ClassicToastBoxProps) => {
    const isError = variant === 'error';

    return (
        <div
            className={`w-[280px] max-w-[calc(100vw-24px)] font-tahoma text-[11px] rounded-[2px] border overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.22)] transition-opacity duration-150 ${
                isError
                    ? 'border-[#8f3d3d] dark:border-border'
                    : 'border-[#45688e] dark:border-border'
            } ${t.visible ? 'opacity-100' : 'opacity-0'}`}
        >
            <div
                className={`px-[9px] py-[4px] flex items-center justify-between select-none border-b shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] text-white ${
                    isError
                        ? 'bg-[#993d3d] border-[#7a2e2e]'
                        : 'bg-[#597da3] border-[#45688e]'
                }`}
            >
                <span className="font-bold text-[11px] leading-[1.2] truncate">
                    {title}
                </span>
                <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    aria-label={i18next.isInitialized ? i18next.t('action.close') : 'action.close'}
                    className="ml-[8px] text-white/80 hover:text-white font-bold text-[13px] leading-none px-[2px] cursor-pointer bg-transparent border-0"
                >
                    ×
                </button>
            </div>

            <div
                className={`px-[10px] py-[9px] flex items-start gap-[9px] ${
                    isError
                        ? 'bg-[#fff7f7] dark:bg-bg-box'
                        : 'bg-[#f7f9fb] dark:bg-bg-box'
                }`}
            >
                <div className="shrink-0 mt-[1px] flex items-center justify-center">
                    {icon}
                </div>
                <div className="text-[11px] leading-[1.4] text-[#222222] dark:text-text-main break-words flex-1">
                    {message}
                </div>
            </div>
        </div>
    );
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

export const dismissToast = (): void => {
    toast.dismiss();
};