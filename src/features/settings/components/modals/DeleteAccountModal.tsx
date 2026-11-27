import { useState, useContext, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/modals/Modal';
import Button from '@/components/ui/Button';
import AuthService from '@/services/auth.service';
import { AuthContext } from '@/context/AuthContext';
import { notifyError, notifySuccess } from '@/components/common/Notify';

interface DeleteOptionsState {
    delete_own_posts: boolean;
    delete_traces: boolean;
    delete_chats: boolean;
}

const INITIAL_OPTIONS: DeleteOptionsState = {
    delete_own_posts: true,
    delete_traces: true,
    delete_chats: true,
};

export interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DeleteAccountModal = ({ isOpen, onClose }: DeleteAccountModalProps) => {
    const { t } = useTranslation();
    const { logout } = useContext(AuthContext);

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const [step, setStep] = useState<1 | 2>(1);
    const [deleteOptions, setDeleteOptions] = useState<DeleteOptionsState>(INITIAL_OPTIONS);
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setStep(1);
            setDeleteOptions(INITIAL_OPTIONS);
            setPassword('');
            setIsProcessing(false);
        }
    }

    const toggleOption = (key: keyof DeleteOptionsState) => {
        setDeleteOptions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSubmit = (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!password.trim() || isProcessing) return;

        setIsProcessing(true);

        AuthService.deleteAccount({
            password,
            ...deleteOptions,
        })
            .onSuccess(async (res) => {
                setIsProcessing(false);

                if (res?.download_url) {
                    window.location.href = res.download_url;
                }

                notifySuccess(t(`code.${res.code}`));
                onClose();

                if (logout) {
                    await logout();
                }
                window.location.href = '/login';
            })
            .onError((err) => {
                setIsProcessing(false);
                notifyError(t(`code.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const footer =
        step === 1 ? (
            <>
                <Button variant="secondary" onClick={onClose}>
                    {t('action.cancel')}
                </Button>
                <Button variant="danger" onClick={() => setStep(2)}>
                    {t('action.continue')}
                </Button>
            </>
        ) : (
            <>
                <Button
                    variant="secondary"
                    onClick={() => setStep(1)}
                    disabled={isProcessing}
                >
                    {t('settings.account_delete.back')}
                </Button>
                <Button
                    variant="danger"
                    onClick={() => handleSubmit()}
                    disabled={!password.trim() || isProcessing}
                >
                    {isProcessing
                        ? t('common.processing')
                        : t('action.delete_permanently')}
                </Button>
            </>
        );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            preventOutsideClose={isProcessing}
            title={t('settings.account_delete.modal_title')}
            footer={footer}
            sizeClass="modal-md"
        >
            {step === 1 ? (
                <div className="flex flex-col gap-[14px]">
                    <div className="border border-theme-error bg-[rgba(230,70,70,0.05)] p-[10px]">
                        <p className="m-0 mb-[6px] text-[11px] font-bold text-theme-error leading-[1.4]">
                            {t('settings.account_delete.warning_title')}
                        </p>
                        <p>{t('settings.account_delete.archive_info')}</p>
                    </div>

                    <div className="flex flex-col">
                        <h4 className="m-0 mb-[10px] text-[11px] font-bold text-theme-error border-b border-[rgba(230,70,70,0.3)] pb-[4px]">
                            {t('settings.account_delete.cleanup_section_title')}
                        </h4>
                        <div className="flex flex-col gap-[8px]">
                            <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                <input
                                    type="checkbox"
                                    className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer"
                                    checked={deleteOptions.delete_own_posts}
                                    onChange={() => toggleOption('delete_own_posts')}
                                />
                                <span>{t('settings.account_delete.opt_delete_posts')}</span>
                            </label>
                            <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                <input
                                    type="checkbox"
                                    className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer"
                                    checked={deleteOptions.delete_traces}
                                    onChange={() => toggleOption('delete_traces')}
                                />
                                <span>{t('settings.account_delete.opt_delete_traces')}</span>
                            </label>
                            <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                <input
                                    type="checkbox"
                                    className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer"
                                    checked={deleteOptions.delete_chats}
                                    onChange={() => toggleOption('delete_chats')}
                                />
                                <span>{t('settings.account_delete.opt_delete_chats')}</span>
                            </label>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
                    <p className="m-0 text-[11px] leading-[1.45] text-text-main">
                        {t('settings.account_delete.final_warning')}
                    </p>
                    <div className="flex flex-col gap-[6px]">
                        <label className="text-[11px] font-bold text-text-main">
                            {t('settings.account_delete.confirm_password')}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('settings.account_delete.password_placeholder')}
                            disabled={isProcessing}
                            autoFocus
                            className="w-full bg-bg-input border border-border px-[8px] py-[6px] text-[11px] text-text-main outline-none focus:border-theme-link"
                        />
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default DeleteAccountModal;