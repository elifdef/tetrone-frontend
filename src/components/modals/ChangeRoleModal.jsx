import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Button from '../ui/Button';
import CustomSelect from '../ui/CustomSelect';
import { userRole } from '../../config';
import {getRoleTitle} from "../profile/utils/getRoleTitle.jsx";
import AdminService from '../../services/admin.service';
import { notifySuccess, notifyError } from '../common/Notify';

export default function ChangeRoleModal({ isOpen, onClose, targetUser, currentUser, onSuccess }) {
    const { t } = useTranslation();
    const [selectedRole, setSelectedRole] = useState(targetUser?.role?.toString() || '0');
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen || !targetUser || !currentUser) return null;

    // Фільтруємо ролі: Адмін не може дати роль вище своєї (Творець може все)
    const availableRoles = Object.entries(userRole)
    .filter(([name, val]) => currentUser.role === userRole.Owner || val < currentUser.role)
    .map(([name, val]) => ({
        value: val.toString(),
        label: getRoleTitle(val)
    }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSaving(true);
        AdminService.changeRole(targetUser.username, parseInt(selectedRole), reason.trim())
        .onSuccess(() => {
            notifySuccess(t('common.success'));
            onSuccess();
            onClose();
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        })
        .onFinally(() => setIsSaving(false));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('admin.actions.change_role')}
            sizeClass="modal-sm"
            preventOutsideClose={true}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-[15px] font-tahoma text-[11px] text-text-main">
                <div>
                    <label className="block font-bold text-theme-link mb-[5px]">{t('admin.common.user')}:</label>
                    <div>{targetUser.first_name} (@{targetUser.username})</div>
                </div>

                <div>
                    <label className="block font-bold text-theme-link mb-[5px]">{t('common.role')}:</label>
                    <CustomSelect
                        options={availableRoles}
                        value={selectedRole}
                        onChange={setSelectedRole}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block font-bold text-theme-link mb-[5px]">{t('admin.reports.reason')}:</label>
                    <textarea
                        className="w-full min-h-[60px] resize-y border border-input-border bg-input-bg p-[6px] text-[11px] text-text-main focus:outline-none focus:border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t('admin.common.prompt_placeholder')}
                        required
                    />
                </div>

                <div className="flex justify-end gap-[10px] mt-[10px]">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {t('action.cancel')}
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSaving || !reason.trim()}>
                        {isSaving ? t('action.saving') : t('action.save')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}