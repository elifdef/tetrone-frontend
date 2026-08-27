import { useState } from 'react';
import Modal from '../modals/Modal.jsx';
import Button from '../ui/Button';
import UserService from '../../services/user.service';
import { notifySuccess, notifyError } from '../common/Notify';
import AddAliasForm from './AddAliasForm';

export default function ManageUsernamesModal({
                                                 isOpen, onClose, primaryUsername, aliases, t,
                                                 onAliasAdded, onAliasDeleted, onAliasSwapped
                                             }) {
    const [view, setView] = useState('list');
    const [loading, setLoading] = useState(false);

    const maxAliases = 16;

    const handleClose = () => {
        setView('list');
        onClose();
    };

    const handleMakePrimary = async (alias) => {
        setLoading(true);
        const res = await UserService.swapAlias(alias);
        setLoading(false);

        if (res) {
            notifySuccess(t('settings.alias_swapped_success'));
            onAliasSwapped(alias);
        } else {
            notifyError(res.message);
        }
    };

    const handleDeleteAlias = async (alias) => {
        if (!window.confirm(t('settings.confirm_delete_alias'))) return;
        setLoading(true);
        const res = await UserService.deleteAlias(alias);
        setLoading(false);

        if (res) {
            notifySuccess(t('settings.alias_deleted_success'));
            onAliasDeleted(alias);
        } else {
            notifyError(res.message);
        }
    };

    const renderList = () => (
        <>
            <div className="p-[15px] bg-bg-box">
                <div className="flex flex-col gap-[8px]">
                    <p className="m-0 mb-[12px] text-[11px] text-text-muted">
                        {t('settings.usernames_desc')}
                    </p>
                    <div className="flex items-center justify-between p-[8px_12px] bg-bg-box border border-theme-link mt-[10px]">
                        <div className="flex items-center gap-[10px] text-[11px] font-bold text-text-main">
                            <span className="px-[4px] py-[2px] text-[9px] border border-theme-link text-theme-link bg-transparent">
                                {t('settings.username_primary')}
                            </span>
                            <span>@{primaryUsername}</span>
                        </div>
                    </div>

                    {aliases.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-[8px_12px] bg-bg-page border border-border hover:bg-bg-hover">
                            <div className="flex items-center gap-[10px] text-[11px] font-bold text-text-main">
                                <span>@{a.handle}</span>
                            </div>
                            <div className="flex gap-[8px] items-center">
                                <Button variant="secondary" onClick={() => handleMakePrimary(a.handle)} disabled={loading}>
                                    {t('action.make_primary')}
                                </Button>
                                <Button variant="danger" onClick={() => handleDeleteAlias(a.handle)} disabled={loading}>
                                    {t('action.delete')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {aliases.length < maxAliases && (
                    <div className="mt-[15px] text-center">
                        <Button variant="secondary" onClick={() => setView('add')} disabled={loading}>
                            + {t('settings.btn_add_alias')}
                        </Button>
                    </div>
                )}
            </div>
            <div className="bg-bg-page border-t border-border py-[10px] px-[15px] flex justify-end items-center gap-[10px]">
                <Button onClick={handleClose} disabled={loading}>{t('action.close')}</Button>
            </div>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={view === 'list' ? t('settings.manage_usernames') : t('settings.add_alias_title')}
            sizeClass="modal-md"
            bodyClassName="!p-0"
        >
            {view === 'list' ? renderList() : (
                <AddAliasForm
                    t={t}
                    onCancel={() => setView('list')}
                    onSuccess={(newAlias) => {
                        setView('list');
                        onAliasAdded(newAlias);
                    }}
                />
            )}
        </Modal>
    );
}