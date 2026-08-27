import { useState, useContext } from "react";
import { useModal } from "../../context/ModalContext";
import { AuthContext } from "../../context/AuthContext";
import { notifyError, notifySuccess } from "../common/Notify";
import AuthService from "../../services/auth.service";
import Button from "../ui/Button";
import { CloseIcon } from "../ui/Icons";

const DangerZone = ({ t }) => {
    const { openConfirm, openCustom, openPassword, closeModal } = useModal();
    const { logout } = useContext(AuthContext);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDeleteAccountFlow = async () => {
        // попередження
        const isSure = await openConfirm(
            t('settings.delete_warning_text'),
            t('settings.delete_account_title'),
            t('action.continue'),
            t('action.cancel')
        );
        if (!isSure) return;

        // налаштування у дві колонки
        const deleteOptions = await new Promise((resolve) => {
            let options = {
                export_posts: true,
                export_chats: true,
                export_files: true,
                export_activity: true,
                delete_own_posts: false,
                delete_traces: false,
                delete_chats: false,
                delete_stickers: false
            };

            openCustom(
                <div className="bg-bg-box border border-[#555] shadow-[0_2px_10px_rgba(0,0,0,0.3)] w-[500px] max-w-full flex flex-col text-text-main m-auto font-tahoma text-[11px] max-md:w-full">
                    <div className="bg-[#597DA3] py-[8px] px-[12px] flex justify-between items-center">
                        <h3 className="m-0 text-[12px] font-bold text-white">{t('settings.delete_options_title')}</h3>
                        <button
                            className="bg-transparent border-none text-white text-[14px] leading-none cursor-pointer p-0 opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center outline-none"
                            onClick={() => { closeModal(); resolve(null); }}
                        >
                            <CloseIcon width={14} height={14} />
                        </button>
                    </div>

                    <div className="p-[15px] overflow-y-auto bg-bg-box">
                        <p className="text-[12px] leading-[1.5] m-0 mb-[15px]">
                            {t('settings.delete_options_desc')}
                        </p>

                        <div className="grid grid-cols-2 gap-[15px] max-md:grid-cols-1">
                            <div className="flex flex-col">
                                <h4 className="m-0 mb-[10px] text-[11px] font-bold text-theme-error border-b border-[rgba(230,70,70,0.3)] pb-[4px]">
                                    {t('settings.export_section_title')}
                                </h4>
                                <div className="flex flex-col gap-[8px]">
                                    <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                        <input type="checkbox" className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer" defaultChecked={options.export_posts} onChange={(e) => options.export_posts = e.target.checked} />
                                        <span>{t('settings.opt_export_posts')}</span>
                                    </label>
                                    <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                        <input type="checkbox" className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer" defaultChecked={options.export_chats} onChange={(e) => options.export_chats = e.target.checked} />
                                        <span>{t('settings.opt_export_chats')}</span>
                                    </label>
                                    <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                        <input type="checkbox" className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer" defaultChecked={options.export_files} onChange={(e) => options.export_files = e.target.checked} />
                                        <span>{t('settings.opt_export_files')}</span>
                                    </label>
                                    <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                        <input type="checkbox" className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer" defaultChecked={options.export_activity} onChange={(e) => options.export_activity = e.target.checked} />
                                        <span>{t('settings.opt_export_activity')}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <h4 className="m-0 mb-[10px] text-[11px] font-bold text-theme-error border-b border-[rgba(230,70,70,0.3)] pb-[4px]">
                                    {t('settings.delete_section_title')}
                                </h4>
                                <div className="flex flex-col gap-[8px]">
                                    <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                        <input type="checkbox" className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer" defaultChecked={options.delete_own_posts} onChange={(e) => options.delete_own_posts = e.target.checked} />
                                        <span>{t('settings.opt_delete_posts')}</span>
                                    </label>
                                    <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                        <input type="checkbox" className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer" defaultChecked={options.delete_traces} onChange={(e) => options.delete_traces = e.target.checked} />
                                        <span>{t('settings.opt_delete_traces')}</span>
                                    </label>
                                    <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                        <input type="checkbox" className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer" defaultChecked={options.delete_chats} onChange={(e) => options.delete_chats = e.target.checked} />
                                        <span>{t('settings.opt_delete_chats')}</span>
                                    </label>
                                    <label className="flex items-center gap-[6px] cursor-pointer select-none text-[11px] text-text-main hover:underline">
                                        <input type="checkbox" className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer" defaultChecked={options.delete_stickers} onChange={(e) => options.delete_stickers = e.target.checked} />
                                        <span>{t('settings.opt_delete_stickers')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-bg-page border-t border-border py-[10px] px-[15px] flex justify-end items-center gap-[10px]">
                        <Button variant="secondary" onClick={() => { closeModal(); resolve(null); }}>
                            {t('action.cancel')}
                        </Button>
                        <Button variant="danger" onClick={() => { closeModal(); resolve(options); }}>
                            {t('action.continue')}
                        </Button>
                    </div>
                </div>
            );
        });

        if (deleteOptions === null) return;

        // введення пароля
        const password = await openPassword(
            t('settings.confirm_password_to_delete'),
            t('common.security'),
            t('action.continue')
        );

        if (!password) return;

        // останній шанс передумати
        const finalChance = await openConfirm(
            t('settings.final_delete_warning'),
            t('settings.final_delete_title'),
            t('action.delete_permanently'),
            t('action.changed_my_mind')
        );

        if (!finalChance) return;

        setIsProcessing(true);
        try {
            const response = await AuthService.deleteAccount({ password, ...deleteOptions });

            if (response && response.success === false) {
                throw new Error(response.message || t('error.action_failed'));
            }

            const isExporting = deleteOptions.export_posts || deleteOptions.export_chats || deleteOptions.export_files || deleteOptions.export_activity;

            if (response && response.download_url) {
                window.location.href = response.download_url;
            }

            notifySuccess(
                isExporting
                    ? t('settings.account_delete_export_started')
                    : t('settings.account_deleted_success')
            );

            window.location.href = '/login';

        } catch (error) {
            let errorText = error.message || t('error.action_failed');

            if (error.response?.data?.message) {
                errorText = error.response.data.message;
            } else if (typeof errorText === 'object') {
                errorText = errorText.text || errorText.message || Object.values(errorText)[0];
            }

            notifyError(String(errorText));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="border border-theme-error bg-[rgba(230,70,70,0.05)] p-[10px_15px]">
            <div className="flex justify-between items-center gap-[15px] max-md:flex-col max-md:items-start">
                <div className="flex-1">
                    <h2 className="m-0 mb-[4px] text-[11px] font-bold text-theme-error">{t('settings.danger_zone')}</h2>

                    {t('easter_eggs.quote') && (
                        <div className="italic text-text-muted text-[11px] mb-[6px] border-l-[2px] border-theme-error pl-[8px] whitespace-pre-line leading-[1.4]">
                            {t('easter_eggs.quote')}
                        </div>
                    )}

                    <p className="m-0 text-[11px] text-text-main">{t('settings.delete_warning')}</p>
                </div>
                <div className="flex-shrink-0 max-md:w-full">
                    <Button
                        variant="danger"
                        onClick={handleDeleteAccountFlow}
                        disabled={isProcessing}
                        className="max-md:w-full"
                    >
                        {isProcessing ? t('common.processing') : t('settings.delete_account')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DangerZone;