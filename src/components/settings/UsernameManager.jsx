import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import ManageUsernamesModal from './ManageUsernamesModal';

export default function UsernameManager({ user, t, onUserUpdate }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [primaryUsername, setPrimaryUsername] = useState('');
    const [aliases, setAliases] = useState([]);

    useEffect(() => {
        setPrimaryUsername(user?.username || '');
        const rawAliases = user?.aliases || user?.handles || [];
        setAliases(rawAliases.map(a => typeof a === 'string' ? { id: a, handle: a } : a));
    }, [user]);

    const handleAliasAdded = (newAlias) => {
        setAliases(prev => [...prev, { id: newAlias, handle: newAlias }]);
        if (onUserUpdate) onUserUpdate();
    };

    const handleAliasDeleted = (deletedAlias) => {
        setAliases(prev => prev.filter(a => a.handle !== deletedAlias));
        if (onUserUpdate) onUserUpdate();
    };

    const handleAliasSwapped = (newPrimary) => {
        const oldPrimary = primaryUsername;
        setPrimaryUsername(newPrimary);
        setAliases(prev => {
            const withoutNew = prev.filter(a => a.handle !== newPrimary);
            return [...withoutNew, { id: oldPrimary, handle: oldPrimary }];
        });
        if (onUserUpdate) onUserUpdate();
    };

    return (
        <div className="tetrone-settings-box">
            <strong>{t('settings.usernames_title')}</strong>
            <p className="tetrone-text-muted">{t('settings.usernames_desc')}</p>

            <div className="tetrone-username-item primary">
                <div className="tetrone-username-info">
                    <span className="tetrone-badge-primary">Primary</span>
                    <span>@{primaryUsername}</span>
                </div>
                <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                    {t('settings.btn_manage_usernames')}
                </Button>
            </div>

            <ManageUsernamesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                primaryUsername={primaryUsername}
                aliases={aliases}
                t={t}
                onAliasAdded={handleAliasAdded}
                onAliasDeleted={handleAliasDeleted}
                onAliasSwapped={handleAliasSwapped}
            />
        </div>
    );
}