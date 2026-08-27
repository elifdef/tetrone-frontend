import { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { SpaceContext } from '../../context/SpaceContext';
import SpaceService from '../../services/space.service';
import Button from '../ui/Button';
import CustomSelect from '../ui/CustomSelect';
import ImageDropzone from '../settings/ImageDropzone';
import SmartEditor from "../editor/SmartEditor.jsx";

const SpaceSettingsTab = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { space, updateSpace } = useContext(SpaceContext);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: null,
        privacy_type: 'public',
        posting_rule: 'all'
    });

    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (space) {
            setForm({
                name: space.name || '',
                description: space.description || null,
                privacy_type: space.privacy_type || 'public',
                posting_rule: space.posting_rule || 'all'
            });
        }
    }, [space]);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleAvatarSelect = (data) => {
        if (!data) return setAvatarFile(null);
        if (data.target && data.target.files) setAvatarFile(data.target.files[0]);
        else if (Array.isArray(data)) setAvatarFile(data[0]);
        else setAvatarFile(data);
    };

    const getAvatarPreview = () => {
        if (avatarFile instanceof File || avatarFile instanceof Blob) return URL.createObjectURL(avatarFile);
        return space.avatar_url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('name', form.name);
            formData.append('privacy_type', form.privacy_type);
            formData.append('posting_rule', form.posting_rule);

            if (form.description) formData.append('description', JSON.stringify(form.description));
            if (avatarFile instanceof File || avatarFile instanceof Blob) formData.append('avatar_file', avatarFile);

            const res = await SpaceService.updateSpace(space.username, formData);
            if (res.space) {
                updateSpace(res.space);
                setAvatarFile(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSpace = async () => {
        if (!window.confirm(t('common.confirm_action'))) return;
        try {
            await SpaceService.deleteSpace(space.username);
            navigate('/spaces');
        } catch (error) {
            console.error(error);
        }
    };

    // ФІКС: Універсальний компонент-рядок для нового дизайну
    const SettingsRow = ({ label, description, children }) => (
        <div className="flex items-start p-[15px] border-b border-border bg-bg-page hover:bg-bg-box transition-colors max-md:flex-col max-md:gap-[10px]">
            <div className="w-[250px] shrink-0">
                <div className="font-bold text-[12px] text-text-main mb-[4px]">{label}</div>
                {description && <div className="text-[10px] text-text-muted leading-[1.4] pr-[20px]">{description}</div>}
            </div>
            <div className="flex-1 w-full min-w-0">
                {children}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="flex flex-col bg-bg-box border border-border">
            <div className="bg-theme-header-bg text-theme-link p-[10px_15px] text-[13px] font-bold border-b border-border">
                {t('spaces.settings')}
            </div>

            <SettingsRow label={t('spaces.field_name')} description={t('spaces.name_placeholder')}>
                <input
                    type="text"
                    className="w-full h-[36px] px-[12px] border border-input-border focus:border-theme-link bg-input-bg text-text-main text-[12px] transition-colors focus:outline-none"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                />
            </SettingsRow>

            <SettingsRow label={t('spaces.avatar')} description="Рекомендований розмір 400x400. Зображення автоматично обрізається.">
                <div className="w-[100px]">
                    <ImageDropzone currentImage={getAvatarPreview()} onFileSelect={handleAvatarSelect} className="aspect-square object-cover border border-border" />
                </div>
            </SettingsRow>

            <SettingsRow label={t('spaces.field_privacy')} description={t(`spaces.privacy_desc_${form.privacy_type}`)}>
                <CustomSelect
                    options={[
                        { value: 'public', label: t('spaces.privacy_public') },
                        { value: 'closed', label: t('spaces.privacy_closed') },
                        { value: 'private', label: t('spaces.privacy_private') }
                    ]}
                    value={form.privacy_type}
                    onChange={(val) => handleChange('privacy_type', val)}
                />
            </SettingsRow>

            <SettingsRow label={t('spaces.field_posting')} description={t('spaces.posting_desc')}>
                <CustomSelect
                    options={[
                        { value: 'all', label: t('spaces.posting_all') },
                        { value: 'admins', label: t('spaces.posting_admins') }
                    ]}
                    value={form.posting_rule}
                    onChange={(val) => handleChange('posting_rule', val)}
                />
            </SettingsRow>

            <SettingsRow label={t('spaces.field_description')} description={t('spaces.description_hint')}>
                <div className="w-full">
                    <SmartEditor
                        preset="bio"
                        value={form.description}
                        onChange={(json) => handleChange('description', json)}
                    />
                </div>
            </SettingsRow>

            <div className="p-[15px] bg-bg-page flex justify-between items-center">
                <Button variant="danger" type="button" onClick={handleDeleteSpace} className="px-[20px] py-[8px] text-[12px]">
                    {t('action.delete')}
                </Button>

                <Button variant="primary" type="submit" disabled={loading || !form.name} className="px-[30px] py-[8px] text-[12px] shadow-sm">
                    {loading ? t('common.loading') : t('action.save')}
                </Button>
            </div>
        </form>
    );
};

export default SpaceSettingsTab;