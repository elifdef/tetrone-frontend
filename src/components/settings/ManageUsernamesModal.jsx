import { useState } from 'react';
import GlobalModal from '../modals/GlobalModal';
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

        if (res.success) {
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

        if (res.success) {
            notifySuccess(t('settings.alias_deleted_success'));
            onAliasDeleted(alias);
        } else {
            notifyError(res.message);
        }
    };

    const renderList = () => (
        <>
            <div className="tetrone-modal-body">
                <div className="tetrone-username-list">
                    <div className="tetrone-username-item primary">
                        <div className="tetrone-username-info">
                            <span className="tetrone-badge-primary">Primary</span>
                            <span>@{primaryUsername}</span>
                        </div>
                    </div>

                    {aliases.map(a => (
                        <div key={a.id} className="tetrone-username-item">
                            <div className="tetrone-username-info">
                                <span>@{a.handle}</span>
                            </div>
                            <div className="tetrone-flex tetrone-gap-8">
                                <Button variant="outline" size="sm" onClick={() => handleMakePrimary(a.handle)} disabled={loading}>
                                    {t('action.make_primary')}
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteAlias(a.handle)} disabled={loading}>
                                    {t('action.delete')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {aliases.length < maxAliases && (
                    <div className="tetrone-mt-15 tetrone-text-center">
                        <Button variant="secondary" onClick={() => setView('add')} disabled={loading}>
                            + {t('settings.btn_add_alias')}
                        </Button>
                    </div>
                )}
            </div>
            <div className="tetrone-modal-footer">
                <Button onClick={handleClose} disabled={loading}>{t('action.close')}</Button>
            </div>
        </>
    );

    return (
        <GlobalModal isOpen={isOpen} onClose={handleClose} type="custom">
            <div className="tetrone-modal-dialog" onClick={e => e.stopPropagation()}>
                <div className="tetrone-modal-header">
                    <h3>{view === 'list' ? t('settings.manage_usernames') : t('settings.add_alias_title')}</h3>
                    <button className="tetrone-modal-close" onClick={handleClose} disabled={loading}>✖</button>
                </div>

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
            </div>
        </GlobalModal>
    );
}