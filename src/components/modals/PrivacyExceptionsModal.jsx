import {useState, useEffect, useMemo, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import Modal from './Modal.jsx';
import PrivacyService from '../../services/privacy.service';
import UserService from '../../services/user.service';
import Button from '../ui/Button';
import {notifyError, notifySuccess} from '../common/Notify';
import Avatar from '../ui/Avatar';

export default function PrivacyExceptionsModal({isOpen, onClose, context, initialExceptions, onSaveSuccess})
{
    const {t} = useTranslation();

    const [searchResults, setSearchResults] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [initialUsernames, setInitialUsernames] = useState([]);
    const [localAllowedUsernames, setLocalAllowedUsernames] = useState([]);

    const searchTimeoutRef = useRef(null);

    useEffect(() =>
    {
        if (isOpen && context)
        {
            const contextEx = initialExceptions.filter(ex => ex.context === context && ex.is_allowed);
            const usernames = contextEx
            .map(ex => ex.target_user?.username)
            .filter(Boolean);

            setInitialUsernames(usernames);
            setLocalAllowedUsernames(usernames);
            setSearch('');
            fetchUsers('');
        }
    }, [isOpen, context, initialExceptions]);

    useEffect(() =>
    {
        if (!isOpen) return;

        if (searchTimeoutRef.current)
        {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() =>
        {
            fetchUsers(search);
        }, 400);

        return () => clearTimeout(searchTimeoutRef.current);
    }, [search, isOpen]);

    const fetchUsers = async (searchQuery) =>
    {
        setIsLoading(true);
        try
        {
            const params = {};
            if (searchQuery.trim() !== '')
            {
                params['filter[search]'] = searchQuery;
            }

            const res = await UserService.getUsers(params);

            const fetchedUsers = res.users || [];
            setSearchResults(fetchedUsers);

        } catch (error)
        {
            notifyError(t('common.error'));
        } finally
        {
            setIsLoading(false);
        }
    };

    const handleToggle = (username) =>
    {
        setLocalAllowedUsernames(prev =>
            prev.includes(username)
                ? prev.filter(u => u !== username)
                : [...prev, username]
        );
    };

    const isDirty = useMemo(() =>
    {
        if (initialUsernames.length !== localAllowedUsernames.length) return true;
        return !localAllowedUsernames.every(u => initialUsernames.includes(u));
    }, [initialUsernames, localAllowedUsernames]);

    const handleSave = async () =>
    {
        if (!isDirty) return;
        setIsSaving(true);

        try
        {
            const addedUsernames = localAllowedUsernames.filter(u => !initialUsernames.includes(u));
            const removedUsernames = initialUsernames.filter(u => !localAllowedUsernames.includes(u));

            const promises = [];

            addedUsernames.forEach(username =>
            {
                promises.push(PrivacyService.setException(username, context, true));
            });

            removedUsernames.forEach(username =>
            {
                const exceptionId = initialExceptions.find(
                    ex => (ex.target_username === username || ex.target_user?.username === username) && ex.context === context
                )?.id;

                if (exceptionId)
                {
                    promises.push(PrivacyService.deleteException(exceptionId));
                }
            });

            await Promise.all(promises);
            notifySuccess(t('settings.exceptions_saved'));

            if (onSaveSuccess) onSaveSuccess();
            onClose();

        } catch (error)
        {
            notifyError(t('common.error'));
        } finally
        {
            setIsSaving(false);
        }
    };

    const displayUsers = useMemo(() =>
    {
        const usersMap = new Map();

        initialExceptions.forEach(ex =>
        {
            if (ex.context === context && ex.is_allowed && ex.target_user)
            {
                usersMap.set(ex.target_user.username, ex.target_user);
            }
        });

        searchResults.forEach(user =>
        {
            usersMap.set(user.username, user);
        });

        return Array.from(usersMap.values()).filter(u =>
        {
            if (!search.trim()) return true;
            const fullName = `${u.first_name || ''} ${u.last_name || ''} ${u.username}`.toLowerCase();
            return fullName.includes(search.toLowerCase());
        });
    }, [searchResults, initialExceptions, context, search]);

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                {t('action.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? t('common.loading') : t('action.save')}
            </Button>
        </>
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
            bodyClassName="tetrone-exceptions-modal-body"
        >
            <div className="tetrone-mb-15">
                <input
                    type="text"
                    className="tetrone-form-input tetrone-w-full"
                    placeholder={t('action.search')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={isSaving}
                />
            </div>

            <div className="tetrone-exceptions-list-container">
                {isLoading && displayUsers.length === 0 ? (
                    <div className="tetrone-empty-state">{t('common.loading')}</div>
                ) : displayUsers.length > 0 ? (
                    displayUsers.map(user =>
                    {
                        const isChecked = localAllowedUsernames.includes(user.username);
                        const nameColor = user.personalization?.username_color;

                        return (
                            <div key={user.username} className="tetrone-mini-user-card" onClick={() => !isSaving && handleToggle(user.username)}>
                                <div className="tetrone-mini-user-info">
                                    <Avatar
                                        user={user}
                                        className="tetrone-mini-user-avatar"
                                    />
                                    <div className="tetrone-mini-user-text">
                                        <span
                                            className="tetrone-mini-user-name"
                                            style={nameColor ? {color: nameColor} : undefined}
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
                    <div className="tetrone-empty-state">
                        {t('empty.list')}
                    </div>
                )}
            </div>
        </Modal>
    );
}