import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import SpaceService from '@/services/space.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import Modal from '@/components/modals/Modal';
import SmartEditor from '@/components/editor/SmartEditor';
import { CloseIcon } from '@/components/ui/Icons';

const CreateSpaceModal = ({ onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        description: null,
        privacy_type: 'public',
        avatar: null
    });

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }

        setFormData(prev => ({ ...prev, avatar: file }));
        setAvatarPreview(URL.createObjectURL(file));
        setFieldErrors(prev => ({ ...prev, avatar_file: null }));
    };

    const handleRemoveAvatar = (e) => {
        e.stopPropagation();
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(null);
        setFormData(prev => ({ ...prev, avatar: null }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUsernameChange = (e) => {
        const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setFormData(prev => ({ ...prev, username: sanitized }));
        setFieldErrors(prev => ({ ...prev, username: null }));
    };

    const handleEditorChange = (content) => {
        setFormData(prev => ({ ...prev, description: content }));
        setFieldErrors(prev => ({ ...prev, description: null }));
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (isProcessing) return;

        setIsProcessing(true);
        setFieldErrors({});

        const payload = new FormData();
        payload.append('name', formData.name.trim());
        payload.append('username', formData.username.trim());
        payload.append('privacy_type', formData.privacy_type);

        if (formData.description) {
            const descValue = typeof formData.description === 'object'
                ? JSON.stringify(formData.description)
                : formData.description;
            payload.append('description', descValue);
        }

        if (formData.avatar) {
            payload.append('avatar_file', formData.avatar);
        }

        SpaceService.createSpace(payload)
            .onSuccess((res) => {
                queryClient.invalidateQueries({ queryKey: ['my_managed_spaces'] });
                notifySuccess(t(`api.success.${res.code || 'SPACE_CREATED'}`));
                onClose();
                if (res.space?.username) {
                    navigate(`/${res.space.username}`);
                }
            })
            .onError((err) => {
                if (err.errors) {
                    setFieldErrors(err.errors);
                }
                notifyError(t(`api.error.${err.code || 'ERR_VALIDATION'}`));
            })
            .onFinally(() => {
                setIsProcessing(false);
            });
    };

    const privacyOptions = [
        {
            value: 'public',
            label: t('spaces.privacy_public'),
            desc: t('spaces.privacy_desc_public')
        },
        {
            value: 'private',
            label: t('spaces.privacy_private'),
            desc: t('spaces.privacy_desc_private')
        },
        {
            value: 'closed',
            label: t('spaces.privacy_closed'),
            desc: t('spaces.privacy_desc_closed')
        }
    ];

    const footerButtons = (
        <div className="flex items-center justify-end gap-[8px] w-full">
            <Button variant="secondary" onClick={onClose} type="button" disabled={isProcessing}>
                {t('action.cancel')}
            </Button>
            <Button
                variant="primary"
                type="submit"
                form="createSpaceForm"
                disabled={isProcessing || !formData.name.trim() || !formData.username.trim()}
            >
                {isProcessing ? t('common.loading') : t('action.create')}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={t('spaces.create')}
            footer={footerButtons}
            sizeClass="modal-md"
        >
            <form id="createSpaceForm" onSubmit={handleSubmit} className="flex flex-col gap-[12px] font-tahoma text-[11px] text-text-main">
                <div className="bg-bg-page border border-border p-[12px] flex items-start gap-[14px] max-sm:flex-col max-sm:items-center">
                    <div className="flex flex-col items-center gap-[4px] shrink-0">
                        <div
                            className="relative w-[88px] h-[88px] border border-border bg-bg-box flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-theme-link overflow-hidden text-text-muted group"
                            onClick={() => fileInputRef.current?.click()}
                            title={t('spaces.avatar')}
                        >
                            {avatarPreview ? (
                                <>
                                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        className="absolute top-[3px] right-[3px] w-[18px] h-[18px] bg-bg-box/90 border border-border text-text-muted hover:text-theme-error flex items-center justify-center cursor-pointer p-0"
                                        title={t('action.delete')}
                                    >
                                        <CloseIcon width={11} height={11} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-[20px] leading-none text-theme-link mb-[2px]">+</span>
                                    <span className="text-[9px] text-center px-[4px] leading-[1.2]">{t('spaces.avatar')}</span>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                        {fieldErrors.avatar_file && (
                            <span className="text-[10px] text-theme-error text-center max-w-[88px]">
                                {fieldErrors.avatar_file[0]}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col gap-[10px] w-full min-w-0">
                        <div className="flex flex-col gap-[4px]">
                            <label className="font-bold text-[11px] text-theme-link">
                                {t('spaces.field_name')} <span className="text-theme-error">*</span>
                            </label>
                            <Input
                                required
                                maxLength={128}
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, name: e.target.value }));
                                    setFieldErrors(prev => ({ ...prev, name: null }));
                                }}
                            />
                            {fieldErrors.name && (
                                <span className="text-[10px] text-theme-error">{fieldErrors.name[0]}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-[4px]">
                            <label className="font-bold text-[11px] text-theme-link">
                                {t('spaces.nickname')} <span className="text-theme-error">*</span>
                            </label>
                            <div className="flex items-stretch border border-border bg-input-bg focus-within:border-theme-link">
                                <span className="px-[8px] flex items-center bg-bg-box border-r border-border text-text-muted font-bold select-none">
                                    @
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleUsernameChange}
                                    className="flex-1 min-w-0 bg-transparent border-none px-[8px] py-[5px] text-[11px] text-text-main outline-none"
                                />
                            </div>
                            <span className="text-[10px] text-text-muted truncate">
                                {window.location.origin}/@{formData.username || 'username'}
                            </span>
                            {fieldErrors.username && (
                                <span className="text-[10px] text-theme-error">{fieldErrors.username[0]}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                    <label className="font-bold text-[11px] text-theme-link">
                        {t('spaces.field_privacy')}
                    </label>
                    <div className="grid grid-cols-3 gap-[6px] max-sm:grid-cols-1">
                        {privacyOptions.map((option) => {
                            const isSelected = formData.privacy_type === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, privacy_type: option.value }))}
                                    className={`text-left p-[8px] border transition-colors cursor-pointer flex flex-col gap-[3px] outline-none ${
                                        isSelected
                                            ? 'border-theme-link bg-[rgba(91,155,213,0.08)]'
                                            : 'border-border bg-bg-page hover:border-theme-link/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-[5px]">
                                        <span
                                            className={`w-[10px] h-[10px] rounded-full border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-theme-link' : 'border-text-muted'
                                            }`}
                                        >
                                            {isSelected && <span className="w-[5px] h-[5px] rounded-full bg-theme-link" />}
                                        </span>
                                        <span className={`font-bold text-[11px] ${isSelected ? 'text-theme-link' : 'text-text-main'}`}>
                                            {option.label}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-text-muted leading-[1.3] pl-[15px]">
                                        {option.desc}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-[4px]">
                    <label className="font-bold text-[11px] text-theme-link">
                        {t('spaces.field_description')}
                    </label>
                    <div className="border border-border bg-bg-box focus-within:border-theme-link">
                        <SmartEditor
                            preset="bio"
                            value={formData.description}
                            onChange={handleEditorChange}
                            placeholder={t('spaces.description_placeholder')}
                        />
                    </div>
                    {fieldErrors.description && (
                        <span className="text-[10px] text-theme-error">{fieldErrors.description[0]}</span>
                    )}
                </div>
            </form>
        </Modal>
    );
};

export default CreateSpaceModal;