import { useState, useContext } from "react";
import { useModal } from "../../context/ModalContext";
import { AuthContext } from "../../context/AuthContext";
import { notifyError, notifySuccess } from "../common/Notify";
import AuthService from "../../services/auth.service";
import Button from "../UI/Button";
import { CloseIcon } from "../UI/Icons";

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

        //налаштування у дві колонки
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
                <div className="tetrone-modal-dialog">
                    <div className="tetrone-modal-header">
                        <h3>{t('settings.delete_options_title')}</h3>
                        <button className="tetrone-modal-close" onClick={() => { closeModal(); resolve(null); }}>
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="tetrone-modal-body">
                        <p className="tetrone-modal-message">
                            {t('settings.delete_options_desc')}
                        </p>

                        <div className="tetrone-delete-options-grid">
                            <div className="tetrone-delete-section">
                                <h4 className="tetrone-delete-section-title">{t('settings.export_section_title')}</h4>
                                <div className="tetrone-settings-checkbox-group">
                                    <label className="tetrone-checkbox-label">
                                        <input type="checkbox" defaultChecked={options.export_posts} onChange={(e) => options.export_posts = e.target.checked} />
                                        <span>{t('settings.opt_export_posts')}</span>
                                    </label>
                                    <label className="tetrone-checkbox-label">
                                        <input type="checkbox" defaultChecked={options.export_chats} onChange={(e) => options.export_chats = e.target.checked} />
                                        <span>{t('settings.opt_export_chats')}</span>
                                    </label>
                                    <label className="tetrone-checkbox-label">
                                        <input type="checkbox" defaultChecked={options.export_files} onChange={(e) => options.export_files = e.target.checked} />
                                        <span>{t('settings.opt_export_files')}</span>
                                    </label>
                                    <label className="tetrone-checkbox-label">
                                        <input type="checkbox" defaultChecked={options.export_activity} onChange={(e) => options.export_activity = e.target.checked} />
                                        <span>{t('settings.opt_export_activity')}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="tetrone-delete-section">
                                <h4 className="tetrone-delete-section-title">{t('settings.delete_section_title')}</h4>
                                <div className="tetrone-settings-checkbox-group">
                                    <label className="tetrone-checkbox-label">
                                        <input type="checkbox" defaultChecked={options.delete_own_posts} onChange={(e) => options.delete_own_posts = e.target.checked} />
                                        <span>{t('settings.opt_delete_posts')}</span>
                                    </label>
                                    <label className="tetrone-checkbox-label">
                                        <input type="checkbox" defaultChecked={options.delete_traces} onChange={(e) => options.delete_traces = e.target.checked} />
                                        <span>{t('settings.opt_delete_traces')}</span>
                                    </label>
                                    <label className="tetrone-checkbox-label">
                                        <input type="checkbox" defaultChecked={options.delete_chats} onChange={(e) => options.delete_chats = e.target.checked} />
                                        <span>{t('settings.opt_delete_chats')}</span>
                                    </label>
                                    <label className="tetrone-checkbox-label">
                                        <input type="checkbox" defaultChecked={options.delete_stickers} onChange={(e) => options.delete_stickers = e.target.checked} />
                                        <span>{t('settings.opt_delete_stickers')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="tetrone-modal-footer">
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
        <div className="tetrone-settings-danger">
            <div className="tetrone-settings-danger-header">{t('settings.danger_zone')}</div>
            <div className="tetrone-settings-danger-body">
                <div>
                    <h4>{t('settings.delete_account')}</h4>
                    <div className="tetrone-settings-quote">{t('easter_eggs.quote')}</div>
                    <p className="tetrone-settings-desc">{t('settings.delete_warning')}</p>
                </div>
                <Button
                    variant="danger"
                    onClick={handleDeleteAccountFlow}
                    disabled={isProcessing}
                >
                    {isProcessing ? t('common.processing') : t('settings.delete_account')}
                </Button>
            </div>
        </div>
    );
};

export default DangerZone;