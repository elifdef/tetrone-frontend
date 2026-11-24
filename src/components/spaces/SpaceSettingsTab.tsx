import { useState, useContext, useEffect, useMemo, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { SpaceContext } from '@/context/space-context';
import SpaceService from '@/services/space.service';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import ImageDropzone, { type ImageDropzoneSelectEvent } from '@/components/settings/ImageDropzone';
import SmartEditor from '@/components/editor/SmartEditor';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import type { SpaceData, SpacePostingRule, SpacePrivacy } from '@/types/space';
import { isTipTapDoc, type TipTapDoc } from '@/types/tiptap';

interface SettingsRowProps {
    label: string;
    description?: string;
    children: ReactNode;
}

interface SpaceSettingsFormState {
    name: string;
    description: TipTapDoc | null;
    privacy_type: SpacePrivacy;
    posting_rule: SpacePostingRule;
}

const parseTipTapDoc = (value: TipTapDoc | string | null | undefined): TipTapDoc | null => {
    if (!value) return null;
    if (typeof value === 'string') {
        try {
            const parsed: unknown = JSON.parse(value);
            return isTipTapDoc(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }
    return isTipTapDoc(value) ? value : null;
};

const SettingsRow = ({ label, description, children }: SettingsRowProps) => (
    <div className="flex items-start p-[12px] border-b border-border bg-bg-box gap-[15px] max-md:flex-col max-md:gap-[6px]">
        <div className="w-[200px] shrink-0 text-right max-md:w-full max-md:text-left">
            <div className="font-bold text-[11px] text-text-muted">{label}:</div>
            {description && (
                <div className="text-[10px] text-text-muted leading-[1.35] mt-[2px]">
                    {description}
                </div>
            )}
        </div>
        <div className="flex-1 w-full min-w-0">
            {children}
        </div>
    </div>
);

interface SpaceSettingsFormProps {
    space: SpaceData;
    updateSpace: (updates: Partial<SpaceData>) => void;
    isOwner: boolean;
}

const SpaceSettingsForm = ({ space, updateSpace, isOwner }: SpaceSettingsFormProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [form, setForm] = useState<SpaceSettingsFormState>(() => ({
        name: space.name || '',
        description: parseTipTapDoc(space.description),
        privacy_type: space.privacy_type || 'public',
        posting_rule: space.posting_rule || 'all',
    }));

    const objectUrl = useMemo(
        () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
        [avatarFile]
    );

    useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [objectUrl]);

    const avatarPreview = objectUrl || space.avatar || '';

    const handleChange = <K extends keyof SpaceSettingsFormState>(
        field: K,
        value: SpaceSettingsFormState[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAvatarSelect = (event: ImageDropzoneSelectEvent) => {
        const selected = event.target?.files?.[0] ?? null;
        setAvatarFile(selected);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', form.name.trim());
        formData.append('privacy_type', form.privacy_type);
        formData.append('posting_rule', form.posting_rule);
        formData.append('is_members_hidden', space.is_members_hidden ? '1' : '0');
        formData.append(
            'description',
            form.description ? JSON.stringify(form.description) : ''
        );
        formData.append(
            'rules',
            space.rules
                ? (typeof space.rules === 'object' ? JSON.stringify(space.rules) : space.rules)
                : ''
        );

        if (Array.isArray(space.links) && space.links.length > 0) {
            space.links.forEach((link, idx) => {
                if (link?.title) formData.append(`links[${idx}][title]`, link.title);
                if (link?.url) formData.append(`links[${idx}][url]`, link.url);
            });
        }

        if (avatarFile) {
            formData.append('avatar_file', avatarFile);
        }

        SpaceService.updateSpace(space.username, formData)
            .onSuccess((res) => {
                if (res.space) {
                    updateSpace(res.space);
                }
                setAvatarFile(null);
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setLoading(false);
            });
    };

    const handleDeleteSpace = () => {
        if (!isOwner || !window.confirm(t('common.confirm_action'))) return;

        SpaceService.deleteSpace(space.username)
            .onSuccess((res) => {
                notifySuccess(t(`api.success.${res.code}`));
                void navigate('/spaces');
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    return (
        <div className="flex flex-col gap-[10px]">
            <form onSubmit={handleSubmit} className="flex flex-col bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[5px_10px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link">
                    {t('spaces.settings')}
                </div>

                <SettingsRow label={t('spaces.field_name')} description={t('spaces.name_placeholder')}>
                    <input
                        type="text"
                        className="w-full h-[30px] px-[8px] border border-input-border focus:border-theme-link bg-input-bg text-text-main text-[11px] transition-colors focus:outline-none"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                    />
                </SettingsRow>

                <SettingsRow label={t('spaces.avatar')} description={t('spaces.avatar_hint')}>
                    <div className="flex items-start gap-[12px] max-sm:flex-col">
                        {avatarPreview && (
                            <img
                                src={avatarPreview}
                                alt={space.name}
                                className="w-[72px] h-[72px] shrink-0 object-cover border border-border"
                            />
                        )}
                        <div className="flex-1 w-full">
                            <ImageDropzone
                                onFileSelect={handleAvatarSelect}
                                fileName={avatarFile?.name ?? null}
                            />
                        </div>
                    </div>
                </SettingsRow>

                <SettingsRow label={t('spaces.field_privacy')} description={t(`spaces.privacy_desc_${form.privacy_type}`)}>
                    <CustomSelect<SpacePrivacy>
                        options={[
                            { value: 'public', label: t('spaces.privacy_public') },
                            { value: 'closed', label: t('spaces.privacy_closed') },
                            { value: 'private', label: t('spaces.privacy_private') },
                        ]}
                        value={form.privacy_type}
                        onChange={(val) => handleChange('privacy_type', val)}
                    />
                </SettingsRow>

                <SettingsRow label={t('spaces.field_posting')} description={t('spaces.posting_desc')}>
                    <CustomSelect<SpacePostingRule>
                        options={[
                            { value: 'all', label: t('spaces.posting_all') },
                            { value: 'admins', label: t('spaces.posting_admins') },
                        ]}
                        value={form.posting_rule}
                        onChange={(val) => handleChange('posting_rule', val)}
                    />
                </SettingsRow>

                <SettingsRow label={t('spaces.field_description')} description={t('spaces.description_hint')}>
                    <SmartEditor
                        preset="bio"
                        value={form.description}
                        onChange={(json) => handleChange('description', json)}
                    />
                </SettingsRow>

                <div className="p-[12px_14px] bg-bg-box flex justify-end">
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading || !form.name.trim()}
                        className="px-[24px] py-[7px] text-[11px]"
                    >
                        {loading ? t('common.loading') : t('action.save')}
                    </Button>
                </div>
            </form>

            {isOwner && (
                <div className="bg-bg-box border border-border p-[12px_14px] flex justify-between items-center max-md:flex-col max-md:gap-[10px] max-md:items-start">
                    <div>
                        <div className="font-bold text-[12px] text-[#ff3347]">
                            {t('spaces.delete_title')}
                        </div>
                        <div className="text-[10px] text-text-muted mt-[2px]">
                            {t('spaces.delete_warning')}
                        </div>
                    </div>
                    <Button variant="danger" type="button" onClick={handleDeleteSpace}>
                        {t('action.delete')}
                    </Button>
                </div>
            )}
        </div>
    );
};

const SpaceSettingsTab = () => {
    const { space, updateSpace, isOwner } = useContext(SpaceContext);

    if (!space) return null;

    return (
        <SpaceSettingsForm
            key={space.username}
            space={space}
            updateSpace={updateSpace}
            isOwner={isOwner}
        />
    );
};

export default SpaceSettingsTab;