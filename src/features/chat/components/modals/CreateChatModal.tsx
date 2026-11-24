import { useState, useRef, useEffect, useMemo } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@ui/Button';
import Avatar from '@ui/Avatar';
import { CloseIcon } from '@ui/Icons';
import Modal from '@components/modals/Modal.jsx';
import SmartEditor from '@components/editor/SmartEditor';
import userService from '@/services/user.service';
import { hasRichContent } from '../utils/messageParser';
import type { TipTapDoc, UserData } from '@/types/user';

export interface CreateGroupChatPayload {
    isGroup: true;
    title: TipTapDoc | string | null;
    description: TipTapDoc | string | null;
    participantUsernames: string[];
    avatarFile: File | null;
    onSuccess: () => void;
    onFinally: () => void;
}

export interface CreateChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserData | null | undefined;
    friendsList?: UserData[];
    onCreateNewChat: (payload: CreateGroupChatPayload) => void;
}

export default function CreateChatModal({
    isOpen,
    onClose,
    currentUser,
    friendsList = [],
    onCreateNewChat,
}: CreateChatModalProps) {
    const { t } = useTranslation();
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const [groupTitle, setGroupTitle] = useState<TipTapDoc | null>(null);
    const [groupDesc, setGroupDesc] = useState<TipTapDoc | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
    const [memberSearch, setMemberSearch] = useState<string>('');
    const [remoteUsers, setRemoteUsers] = useState<UserData[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const query = memberSearch.trim();
        if (query.length < 2) {
            setRemoteUsers([]);
            setIsSearchingUsers(false);
            return undefined;
        }

        let isCancelled = false;
        setIsSearchingUsers(true);

        const timer = setTimeout(() => {
            userService
                .searchUsers(query)
                .onSuccess((res) => {
                    if (isCancelled) return;
                    const list = Array.isArray(res?.users) ? res.users : [];
                    setRemoteUsers(list);
                })
                .onError(() => {
                    if (!isCancelled) setRemoteUsers([]);
                })
                .onFinally(() => {
                    if (!isCancelled) setIsSearchingUsers(false);
                });
        }, 280);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [memberSearch, isOpen]);

    const resetForm = () => {
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setGroupTitle(null);
        setGroupDesc(null);
        setAvatarFile(null);
        setAvatarPreview(null);
        setSelectedUsers([]);
        setMemberSearch('');
        setRemoteUsers([]);
        setIsSubmitting(false);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose();
    };

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleRemoveAvatar = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarFile(null);
        setAvatarPreview(null);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    };

    const availableUsers = useMemo(() => {
        const query = memberSearch.trim().toLowerCase();
        const combinedMap = new Map<string, UserData>();

        friendsList.forEach((u) => {
            if (u?.username && u.username !== currentUser?.username) {
                combinedMap.set(u.username, u);
            }
        });

        remoteUsers.forEach((u) => {
            if (u?.username && u.username !== currentUser?.username && !combinedMap.has(u.username)) {
                combinedMap.set(u.username, u);
            }
        });

        const list = Array.from(combinedMap.values());
        if (!query) return list;

        return list.filter((u) => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
            const username = u.username.toLowerCase();
            return fullName.includes(query) || username.includes(query);
        });
    }, [friendsList, remoteUsers, memberSearch, currentUser?.username]);

    const selectedUsernamesSet = useMemo(
        () => new Set(selectedUsers.map((u) => u.username)),
        [selectedUsers]
    );

    const toggleUserSelection = (userObj: UserData) => {
        if (!userObj?.username) return;
        setSelectedUsers((prev) =>
            prev.some((u) => u.username === userObj.username)
                ? prev.filter((u) => u.username !== userObj.username)
                : [...prev, userObj]
        );
    };

    const canSubmit = hasRichContent(groupTitle) && !isSubmitting;

    const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        onCreateNewChat({
            isGroup: true,
            title: groupTitle,
            description: hasRichContent(groupDesc) ? groupDesc : null,
            participantUsernames: selectedUsers.map((u) => u.username),
            avatarFile,
            onSuccess: () => {
                resetForm();
                onClose();
            },
            onFinally: () => {
                setIsSubmitting(false);
            },
        });
    };

    if (!isOpen) return null;

    const footerContent = (
        <div className="flex items-center justify-between gap-[8px] w-full">
            <span className="text-[10px] text-text-muted">
                {t('chat.modals.selected_participants', { count: selectedUsers.length })}
            </span>
            <div className="flex items-center gap-[8px]">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isSubmitting}
                >
                    {t('chat.actions.cancel')}
                </Button>
                <Button
                    type="submit"
                    form="createGroupChatForm"
                    variant="primary"
                    disabled={!canSubmit}
                >
                    {isSubmitting ? t('common.loading') : t('chat.actions.create_group')}
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={handleClose}
            title={t('chat.modals.create_group_title')}
            footer={footerContent}
            sizeClass="modal-md"
            bodyClassName="p-[14px]"
        >
            <form
                id="createGroupChatForm"
                onSubmit={handleSubmit}
                className="flex flex-col gap-[12px] font-tahoma text-[11px] text-text-main"
            >
                <div className="bg-bg-page border border-border p-[12px] flex items-start gap-[12px] max-sm:flex-col max-sm:items-center">
                    <div className="flex flex-col items-center gap-[4px] shrink-0">
                        <div
                            onClick={() => avatarInputRef.current?.click()}
                            title={t('chat.modals.group_avatar')}
                            className="relative w-[84px] h-[84px] border border-border bg-bg-box flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-theme-link overflow-hidden text-text-muted"
                        >
                            {avatarPreview ? (
                                <>
                                    <img
                                        src={avatarPreview}
                                        alt=""
                                        className="w-full h-full object-cover block"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        title={t('action.delete')}
                                        className="absolute top-[3px] right-[3px] w-[18px] h-[18px] bg-bg-box/90 border border-border text-text-muted hover:text-theme-error flex items-center justify-center cursor-pointer p-0"
                                    >
                                        <CloseIcon width={11} height={11} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-[20px] leading-none text-theme-link mb-[2px]">+</span>
                                    <span className="text-[9px] text-center px-[4px] leading-[1.2]">
                                        {t('chat.modals.group_avatar')}
                                    </span>
                                </>
                            )}
                        </div>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>

                    <div className="flex-1 flex flex-col gap-[8px] w-full min-w-0">
                        <div className="flex flex-col gap-[4px]">
                            <label className="font-bold text-[11px] text-theme-link">
                                {t('chat.info_modal.group_title')} <span className="text-theme-error">*</span>
                            </label>
                            <div className="border border-border bg-bg-box focus-within:border-theme-link">
                                <SmartEditor
                                    className="min-h-[34px] p-[6px] text-[12px] outline-none"
                                    value={groupTitle}
                                    onChange={setGroupTitle}
                                    placeholder={t('chat.modals.group_title_placeholder')}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-[4px]">
                            <label className="font-bold text-[11px] text-theme-link">
                                {t('chat.info_modal.group_desc')}
                            </label>
                            <div className="border border-border bg-bg-box focus-within:border-theme-link">
                                <SmartEditor
                                    preset="bio"
                                    className="min-h-[48px] p-[6px] text-[11px] outline-none"
                                    value={groupDesc}
                                    onChange={setGroupDesc}
                                    placeholder={t('chat.modals.group_desc_placeholder')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-theme-link">
                            {t('chat.modals.selected_participants', { count: selectedUsers.length })}
                        </span>
                        {selectedUsers.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedUsers([])}
                                className="bg-transparent border-none p-0 text-[10px] text-text-muted hover:text-theme-error hover:underline cursor-pointer"
                            >
                                {t('chat.modals.clear_selection')}
                            </button>
                        )}
                    </div>

                    {selectedUsers.length > 0 ? (
                        <div className="flex flex-wrap gap-[5px] p-[7px] bg-bg-page border border-border max-h-[82px] overflow-y-auto">
                            {selectedUsers.map((u) => (
                                <div
                                    key={u.username}
                                    className="inline-flex items-center gap-[5px] pl-[3px] pr-[6px] py-[2px] bg-bg-box border border-theme-link/60 text-[11px] text-text-main"
                                >
                                    <Avatar
                                        user={u}
                                        className="w-[18px] h-[18px] object-cover border border-border shrink-0"
                                    />
                                    <span className="max-w-[130px] truncate font-bold">
                                        {u.first_name || u.username}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => toggleUserSelection(u)}
                                        title={t('action.delete')}
                                        className="bg-transparent border-none p-0 ml-[1px] text-text-muted hover:text-theme-error flex items-center justify-center cursor-pointer"
                                    >
                                        <CloseIcon width={10} height={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-[8px] py-[6px] bg-bg-page border border-border text-[10px] text-text-muted">
                            {t('chat.modals.no_participants_selected')}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-[6px]">
                    <div className="relative flex items-center border border-border bg-input-bg focus-within:border-theme-link">
                        <input
                            type="text"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            placeholder={t('chat.modals.search_users_placeholder')}
                            className="w-full px-[8px] py-[6px] pr-[24px] bg-transparent border-none text-[11px] text-text-main outline-none"
                        />
                        {memberSearch && (
                            <button
                                type="button"
                                onClick={() => setMemberSearch('')}
                                title={t('action.close')}
                                className="absolute right-[6px] bg-transparent border-none p-0 text-text-muted hover:text-theme-link flex items-center justify-center cursor-pointer"
                            >
                                <CloseIcon width={11} height={11} />
                            </button>
                        )}
                    </div>

                    <div className="border border-border bg-bg-box max-h-[185px] overflow-y-auto divide-y divide-border">
                        {isSearchingUsers && availableUsers.length === 0 ? (
                            <div className="p-[14px] text-center text-[11px] text-text-muted">
                                {t('chat.modals.loading_users')}
                            </div>
                        ) : availableUsers.length === 0 ? (
                            <div className="p-[14px] text-center text-[11px] text-text-muted">
                                {t('chat.modals.no_users_found')}
                            </div>
                        ) : (
                            availableUsers.map((userItem) => {
                                const isChecked = selectedUsernamesSet.has(userItem.username);
                                return (
                                    <div
                                        key={userItem.username}
                                        onClick={() => toggleUserSelection(userItem)}
                                        className={`flex items-center justify-between gap-[8px] px-[8px] py-[6px] cursor-pointer transition-colors ${
                                            isChecked
                                                ? 'bg-[rgba(91,155,213,0.12)]'
                                                : 'hover:bg-bg-hover'
                                        }`}
                                    >
                                        <div className="flex items-center gap-[8px] min-w-0">
                                            <Avatar
                                                user={userItem}
                                                className="w-[28px] h-[28px] object-cover border border-border shrink-0"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-[11px] text-theme-link truncate">
                                                    {userItem.first_name || userItem.username} {userItem.last_name || ''}
                                                </span>
                                                <span className="text-[10px] text-text-muted truncate">
                                                    @{userItem.username}
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className={`w-[14px] h-[14px] border flex items-center justify-center shrink-0 transition-colors ${
                                                isChecked
                                                    ? 'border-theme-link bg-theme-link text-white'
                                                    : 'border-input-border bg-bg-page'
                                            }`}
                                        >
                                            {isChecked && (
                                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="2,6.5 4.8,9.2 10,3" />
                                                </svg>
                                            )}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </form>
        </Modal>
    );
}