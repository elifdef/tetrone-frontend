import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/modals/Modal';
import PrivacyService from '@/services/privacy.service';
import UserService from '@/services/user.service';
import Button from '@/components/ui/Button';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import Avatar from '@/components/ui/Avatar';
import type { UserData } from '@/types/user';
import type {
    PrivacyContextType,
    PrivacyExceptionItem,
    PrivacyExceptionTargetUser,
} from '../../types/settings';

export interface PrivacyExceptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    context: PrivacyContextType | null;
    initialExceptions: PrivacyExceptionItem[];
    onSaveSuccess?: () => void;
}

const extractAllowedUsernames = (
    exceptions: PrivacyExceptionItem[],
    context: PrivacyContextType | null
): string[] => {
    if (!context) return [];
    return exceptions
        .filter((ex) => ex.context === context && ex.is_allowed)
        .map((ex) => ex.target_user?.username)
        .filter((u): u is string => Boolean(u));
};

export default function PrivacyExceptionsModal({
    isOpen,
    onClose,
    context,
    initialExceptions,
    onSaveSuccess,
}: PrivacyExceptionsModalProps) {
    const { t } = useTranslation();

    const [searchResults, setSearchResults] = useState<UserData[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const openSessionKey = isOpen && context ? `${context}` : '';
    const [prevSessionKey, setPrevSessionKey] = useState('');
    const [initialUsernames, setInitialUsernames] = useState<string[]>([]);
    const [localAllowedUsernames, setLocalAllowedUsernames] = useState<string[]>([]);

    if (openSessionKey !== prevSessionKey) {
        setPrevSessionKey(openSessionKey);
        if (openSessionKey) {
            const usernames = extractAllowedUsernames(initialExceptions, context);
            setInitialUsernames(usernames);
            setLocalAllowedUsernames(usernames);
            setSearch('');
            setIsLoading(true);
        }
    }

    useEffect(() => {
        if (!isOpen || !context) return;

        const timer = setTimeout(() => {
            const params: Record<string, string> = {};
            if (search.trim() !== '') {
                params['filter[search]'] = search;
            }

            UserService.getUsers(params)
                .onSuccess((res) => {
                    setSearchResults(res.users || []);
                    setIsLoading(false);
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                    setIsLoading(false);
                });
        }, search === '' ? 0 : 400);

        return () => clearTimeout(timer);
    }, [search, isOpen, context, t]);

    const handleToggle = (username: string) => {
        setLocalAllowedUsernames((prev) =>
            prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
        );
    };

    const isDirty = useMemo(() => {
        if (initialUsernames.length !== localAllowedUsernames.length) return true;
        return !localAllowedUsernames.every((u) => initialUsernames.includes(u));
    }, [initialUsernames, localAllowedUsernames]);

    const handleSave = () => {
        if (!isDirty || !context) return;
        setIsSaving(true);

        const addedUsernames = localAllowedUsernames.filter((u) => !initialUsernames.includes(u));
        const removedUsernames = initialUsernames.filter((u) => !localAllowedUsernames.includes(u));

        const totalRequests = addedUsernames.length + removedUsernames.length;
        if (totalRequests === 0) {
            setIsSaving(false);
            return;
        }

        let completed = 0;
        let hasError = false;

        const checkCompletion = () => {
            completed++;
            if (completed === totalRequests && !hasError) {
                notifySuccess(t('settings.exceptions_saved'));
                onSaveSuccess?.();
                onClose();
                setIsSaving(false);
            }
        };

        const handleError = (err: { code?: string }) => {
            if (!hasError) {
                hasError = true;
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                setIsSaving(false);
            }
        };

        addedUsernames.forEach((username) => {
            PrivacyService.setException(username, context, true)
                .onSuccess(checkCompletion)
                .onError(handleError);
        });

        removedUsernames.forEach((username) => {
            PrivacyService.deleteException(username, context)
                .onSuccess(checkCompletion)
                .onError(handleError);
        });
    };

    const displayUsers = useMemo(() => {
        const usersMap = new Map<string, Partial<UserData> & PrivacyExceptionTargetUser>();

        initialExceptions.forEach((ex) => {
            if (ex.context === context && ex.is_allowed && ex.target_user) {
                usersMap.set(ex.target_user.username, ex.target_user);
            }
        });

        searchResults.forEach((user) => {
            usersMap.set(user.username, {
                id: user.id ?? 0,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                avatar: user.avatar,
                username_color: user.personalization?.username_color,
                personalization: user.personalization,
            });
        });

        return Array.from(usersMap.values()).filter((u) => {
            if (!search.trim()) return true;
            const fullName =
                `${u.first_name || ''} ${u.last_name || ''} ${u.username}`.toLowerCase();
            return fullName.includes(search.toLowerCase());
        });
    }, [searchResults, initialExceptions, context, search]);

    const footerButtons = (
        <div className="flex justify-end gap-[10px] w-full">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                {t('action.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? t('common.loading') : t('action.save')}
            </Button>
        </div>
    );

    const modalTitle = context
        ? `${t('privacy.manage_exceptions')} — ${t(`privacy.context_${context}`)}`
        : t('privacy.manage_exceptions');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            sizeClass="modal-md"
            footer={footerButtons}
            bodyClassName="p-[15px]"
        >
            <div className="mb-[15px]">
                <input
                    type="text"
                    className="w-full bg-input-bg border border-input-border text-text-main p-[6px_10px] text-[11px] outline-none focus:border-theme-link transition-colors placeholder:text-text-muted"
                    placeholder={t('action.search')}
                    value={search}
                    onChange={(e) => {
                        setIsLoading(true);
                        setSearch(e.target.value);
                    }}
                    disabled={isSaving}
                />
            </div>

            <div className="flex flex-col border border-border bg-bg-box h-[300px] overflow-y-auto custom-scrollbar">
                {isLoading && displayUsers.length === 0 ? (
                    <div className="p-[20px] text-center text-[11px] text-text-muted italic flex-1 flex items-center justify-center">
                        {t('common.loading')}
                    </div>
                ) : displayUsers.length > 0 ? (
                    displayUsers.map((user) => {
                        const isChecked = localAllowedUsernames.includes(user.username);
                        const nameColor =
                            user.personalization?.username_color || user.username_color;

                        return (
                            <div
                                key={user.username}
                                className="flex items-center justify-between p-[8px_10px] border-b border-border last:border-b-0 cursor-pointer hover:bg-[rgba(128,128,128,0.05)] transition-colors"
                                onClick={() => !isSaving && handleToggle(user.username)}
                            >
                                <div className="flex items-center gap-[10px]">
                                    <Avatar
                                        user={user}
                                        className="w-[32px] h-[32px] object-cover shrink-0"
                                    />
                                    <div className="flex flex-col">
                                        <span
                                            className="text-[11px] font-bold leading-tight"
                                            style={
                                                nameColor
                                                    ? { color: nameColor }
                                                    : { color: 'var(--color-text-main)' }
                                            }
                                        >
                                            {user.first_name} {user.last_name}
                                        </span>
                                        <span className="text-[10px] text-text-muted leading-tight mt-[2px]">
                                            @{user.username}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center shrink-0 ml-[10px]">
                                    <input
                                        type="checkbox"
                                        className="m-0 pointer-events-none accent-theme-link w-[14px] h-[14px]"
                                        checked={isChecked}
                                        readOnly
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-[20px] text-center text-[11px] text-text-muted italic flex-1 flex items-center justify-center">
                        {t('empty.list')}
                    </div>
                )}
            </div>
        </Modal>
    );
}