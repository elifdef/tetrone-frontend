import toast from 'react-hot-toast';
import i18next from 'i18next';
import InfoIcon from '../../assets/info.svg?react';
import SuccessIcon from '../../assets/success.svg?react';
import ErrorIcon from '../../assets/error.svg?react';
import WarningIcon from '../../assets/warning.svg?react';
import LoadingIcon from '../../assets/loader.svg?react';

// Знімаємо дефолтні стилі react-hot-toast, щоб повністю керувати ними через наш div
const toastOptions = {
    duration: 4000,
    position: 'bottom-right',
    style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
        borderRadius: 0,
    }
};

const renderToast = (message, IconComponent) => {
    toast.dismiss();
    return toast((t) => (
        <div className="flex items-center gap-[10px] bg-bg-box border border-border p-[10px] text-[11px] text-text-main font-tahoma shadow-[2px_2px_4px_rgba(0,0,0,0.2)] min-w-[200px] max-w-[300px]">
            <div className="flex-shrink-0 flex items-center justify-center">
                {IconComponent}
            </div>
            <span className="leading-[1.4] word-break break-word">{message}</span>
        </div>
    ), toastOptions);
};

export const notifyInfo = (message) => renderToast(message, <InfoIcon width={20} height={20} fill="#71aaeb" />);
export const notifySuccess = (message) => renderToast(message, <SuccessIcon width={20} height={20} fill="#4bb34b" />);
export const notifyError = (message) => renderToast(message, <ErrorIcon width={20} height={20} fill="#ff3347" />);
export const notifyWarn = (message) => renderToast(message, <WarningIcon width={20} height={20} fill="#f5c400" />);

export const notifyLoading = (message) => {
    toast.dismiss();
    const text = message || i18next.t('common.processing');

    return toast((t) => (
        <div className="flex items-center gap-[10px] bg-bg-box border border-border p-[10px] text-[11px] text-text-main font-tahoma shadow-[2px_2px_4px_rgba(0,0,0,0.2)] min-w-[200px] max-w-[300px]">
            <div className="flex-shrink-0 flex items-center justify-center">
                <LoadingIcon width={20} height={20} fill="#777" className="animate-spin" />
            </div>
            <span className="leading-[1.4] word-break break-word">{text}</span>
        </div>
    ), {
        ...toastOptions,
        duration: Infinity
    });
};

export const dismissToast = () => {
    toast.dismiss();
};