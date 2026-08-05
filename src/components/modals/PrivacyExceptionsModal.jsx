import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from './GlobalModal';
import PrivacyService from '../../services/privacy.service';
import UserService from '../../services/user.service';
import Button from '../ui/Button';
import { notifyError, notifySuccess } from '../common/Notify';
import Avatar from '../ui/Avatar';

export default function PrivacyExceptionsModal({ isOpen, onClose, context, initialExceptions, onSaveSuccess }) {
    const { t } = useTranslation();

    const [searchResults, setSearchResults] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [initialIds, setInitialIds] = useState([]);
    const [localAllowedIds, setLocalAllowedIds] = useState([]);

    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        if (isOpen && context) {
            const contextEx = initialExceptions.filter(ex => ex.context === context && ex.is_allowed);
            const ids = contextEx.map(ex => ex.target_user_id);

            setInitialIds(ids);
            setLocalAllowedIds(ids);
            setSearch('');
            fetchUsers('');
        }
    }, [isOpen, context, initialExceptions]);

    useEffect(() => {
        if (!isOpen) return;

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchUsers(search);
        }, 400);

        return () => clearTimeout(searchTimeoutRef.current);
    }, [search, isOpen]);

    const fetchUsers = async (searchQuery) => {
        setIsLoading(true);
        try {
            const params = {};
            if (searchQuery.trim() !== '') {
                params['filter[search]'] = searchQuery;
            }

            const res = await UserService.getUsers(params);

            // Надійна вибірка: підтримує як плоский масив, так і пагінатор Laravel
            const fetchedUsers = res?.users?.data || res?.users || [];
            setSearchResults(fetchedUsers);

        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (userId) => {
        setLocalAllowedIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const isDirty = useMemo(() => {
        if (initialIds.length !== localAllowedIds.length) return true;
        return !localAllowedIds.every(id => initialIds.includes(id));
    }, [initialIds, localAllowedIds]);

    const handleSave = async () => {
        if (!isDirty) return;
        setIsSaving(true);

        try {
            const addedIds = localAllowedIds.filter(id => !initialIds.includes(id));
            const removedIds = initialIds.filter(id => !localAllowedIds.includes(id));

            const promises = [];

            addedIds.forEach(id => {
                promises.push(PrivacyService.setException(id, context, true));
            });

            removedIds.forEach(id => {
                const exceptionId = initialExceptions.find(
                    ex => ex.target_user_id === id && ex.context === context
                )?.id;

                if (exceptionId) {
                    promises.push(PrivacyService.deleteException(exceptionId));
                }
            });

            await Promise.all(promises);
            notifySuccess(t('settings.exceptions_saved'));

            if (onSaveSuccess) onSaveSuccess();
            onClose();

        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    const displayUsers = useMemo(() => {
        const usersMap = new Map();

        initialExceptions.forEach(ex => {
            if (ex.context === context && ex.is_allowed && ex.target_user) {
                usersMap.set(ex.target_user.id, ex.target_user);
            }
        });

        searchResults.forEach(user => {
            usersMap.set(user.id, user);
        });

        return Array.from(usersMap.values()).filter(u => {
            if (!search.trim()) return true;
            const fullName = `${u.first_name || ''} ${u.last_name || ''} ${u.username}`.toLowerCase();
            return fullName.includes(search.toLowerCase());
        });
    }, [searchResults, initialExceptions, context, search]);

    return (
        <GlobalModal
            isOpen={isOpen}
            onClose={onClose}
            onResolve={onClose}
            type="custom"
            title={context ? t(`privacy.context_${context}`) : ''}
        >
            <div className="tetrone-modal-dialog modal-md tetrone-exceptions-modal">
                <div className="tetrone-modal-header">
                    <h3>{t('privacy.manage_exceptions')}</h3>
                    <button className="tetrone-modal-close" onClick={onClose} disabled={isSaving}></button>
                </div>

                <div className="tetrone-modal-body tetrone-exceptions-modal-body">
                    <input
                        type="text"
                        className="tetrone-form-input tetrone-mb-15"
                        placeholder={t('action.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        disabled={isSaving}
                    />

                    <div className="tetrone-exceptions-list-container">
                        {isLoading && displayUsers.length === 0 ? (
                            <div className="tetrone-loading">{t('common.loading')}</div>
                        ) : displayUsers.length > 0 ? (
                            displayUsers.map(user => {
                                const isChecked = localAllowedIds.includes(user.id);
                                const nameColor = user.personalization?.username_color;

                                return (
                                    <div key={user.id} className="tetrone-mini-user-card" onClick={() => !isSaving && handleToggle(user.id)}>
                                        <div className="tetrone-mini-user-info">
                                            <Avatar
                                                user={user}
                                                className="tetrone-mini-user-avatar"
                                            />
                                            <div className="tetrone-mini-user-text">
                                                <span
                                                    className="tetrone-mini-user-name"
                                                    style={nameColor ? { color: nameColor } : undefined}
                                                >
                                                    {user.first_name} {user.last_name}
                                                </span>
                                                <span className="tetrone-mini-user-username">
                                                    @{user.username}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="tetrone-mini-user-action">
                                            <input
                                                type="checkbox"
                                                className="tetrone-checkbox"
                                                checked={isChecked}
                                                readOnly
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="tetrone-empty-state tetrone-text-center tetrone-mt-15">
                                {t('empty.list')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="tetrone-modal-footer">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                        {t('action.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                    >
                        {isSaving ? t('common.loading') : t('action.save')}
                    </Button>
                </div>
            </div>
        </GlobalModal>
    );
}