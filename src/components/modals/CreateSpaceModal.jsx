import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import SpaceService from '../../services/space.service';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CustomSelect from '../ui/CustomSelect';
import { notifyError, notifySuccess } from '../common/Notify';
import Modal from './Modal';
import SmartEditor from "../editor/SmartEditor.jsx";

const CreateSpaceModal = ({ onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        description: null,
        privacy_type: 'public',
        avatar: null
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, avatar: file }));
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleEditorChange = (content) => {
        setFormData(prev => ({ ...prev, description: content }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsProcessing(true);

        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('username', formData.username);
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

            const res = await SpaceService.createSpace(payload);

            if (res.space) {
                notifySuccess(t('spaces.created'));
                onClose();
                navigate(`/${res.space.username}`);
            }
        } catch (error) {
            notifyError(error.response?.data?.message || 'Error');
        } finally {
            setIsProcessing(false);
        }
    };

    const privacyOptions = [
        { value: 'public', label: t('spaces.privacy_public') },
        { value: 'private', label: t('spaces.privacy_private') },
        { value: 'closed', label: t('spaces.privacy_closed') }
    ];

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={onClose} type="button">
                {t('action.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isProcessing}>
                {isProcessing ? t('common.loading') : t('action.create')}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={t('spaces.create')}
            footer={footerButtons}
            sizeClass="modal-md"
        >
            <form id="createSpaceForm" onSubmit={handleSubmit} className="flex flex-col gap-[15px]">
                <div className="flex flex-col">
                    <label className="font-bold text-[11px] text-theme-link mb-[4px]">{t('spaces.avatar')}</label>
                    <div
                        className="w-[100px] h-[100px] border border-border bg-bg-box flex items-center justify-center cursor-pointer transition-colors hover:border-theme-link overflow-hidden text-text-muted mx-auto"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover"/>
                        ) : (
                            <span className="text-[24px]">+</span>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange}/>
                </div>

                <div className="flex flex-col">
                    <label className="font-bold text-[11px] text-theme-link mb-[4px]">{t('spaces.field_name')}</label>
                    <Input required value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}/>
                </div>

                <div className="flex flex-col">
                    <label className="font-bold text-[11px] text-theme-link mb-[4px]">{t('spaces.nickname')}</label>
                    <Input required value={formData.username} onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}/>
                </div>

                <div className="flex flex-col">
                    <label className="font-bold text-[11px] text-theme-link mb-[4px]">{t('spaces.field_description')}</label>
                    <div className="w-full">
                        <SmartEditor
                            preset="bio"
                            value={formData.description}
                            onChange={handleEditorChange}
                            placeholder={t('spaces.description_placeholder')}
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="font-bold text-[11px] text-theme-link mb-[4px]">{t('spaces.field_privacy')}</label>
                    <CustomSelect
                        options={privacyOptions}
                        value={formData.privacy_type}
                        onChange={(val) => setFormData(prev => ({ ...prev, privacy_type: val }))}
                    />
                </div>
            </form>
        </Modal>
    );
};

export default CreateSpaceModal;