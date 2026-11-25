import { useState } from 'react';
import type { TFunction } from 'i18next';
import Button from '@/components/ui/Button';
import ManageUsernamesModal from './modals/ManageUsernamesModal';
import type { UserData } from '@/types/user';
import type { UserAliasItem } from '../types/settings';

export interface UsernameManagerProps {
    user: UserData | null;
    t: TFunction;
    onUserUpdate?: () => void;
}

const mapUserAliases = (rawAliases?: UserData['aliases']): UserAliasItem[] =>
    (rawAliases || []).map((a) => (typeof a === 'string' ? { id: a, handle: a } : a));

export default function UsernameManager({ user, t, onUserUpdate }: UsernameManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [prevUser, setPrevUser] = useState(user);
    const [primaryUsername, setPrimaryUsername] = useState(() => user?.username || '');
    const [aliases, setAliases] = useState<UserAliasItem[]>(() => mapUserAliases(user?.aliases));

    if (user !== prevUser) {
        setPrevUser(user);
        setPrimaryUsername(user?.username || '');
        setAliases(mapUserAliases(user?.aliases));
    }

    const handleAliasAdded = (newAlias: string) => {
        setAliases((prev) => [...prev, { id: newAlias, handle: newAlias }]);
        onUserUpdate?.();
    };

    const handleAliasDeleted = (deletedAlias: string) => {
        setAliases((prev) => prev.filter((a) => a.handle !== deletedAlias));
        onUserUpdate?.();
    };

    const handleAliasSwapped = (newPrimary: string) => {
        const oldPrimary = primaryUsername;
        setPrimaryUsername(newPrimary);
        setAliases((prev) => {
            const withoutNew = prev.filter((a) => a.handle !== newPrimary);
            return [...withoutNew, { id: oldPrimary, handle: oldPrimary }];
        });
        onUserUpdate?.();
    };

    return (
        <div className="p-[12px_15px] border-b border-border last:border-b-0">
            <h2 className="m-0 mb-[10px] text-[11px] font-bold text-theme-link border-b border-border pb-[4px]">
                {t('settings.usernames_title')}
            </h2>

            <div className="flex items-center justify-between p-[8px_12px] bg-bg-box border border-theme-link mt-[10px] max-md:flex-col max-md:items-start max-md:gap-[8px]">
                <div className="flex items-center gap-[10px] text-[11px] font-bold text-text-main">
                    <span className="px-[4px] py-[2px] text-[9px] border border-theme-link text-theme-link bg-transparent uppercase">
                        {t('settings.username_primary')}
                    </span>
                    <span>@{primaryUsername}</span>
                </div>
                <div className="max-md:w-full">
                    <Button
                        variant="secondary"
                        onClick={() => setIsModalOpen(true)}
                        className="max-md:w-full"
                    >
                        {t('settings.btn_manage_usernames')}
                    </Button>
                </div>
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