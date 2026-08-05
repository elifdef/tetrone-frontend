import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import SpaceService from '../../services/space.service';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Editor from '../editor/Editor';
import { notifyError, notifySuccess } from '../common/Notify';

const CreateSpaceModal = ({ onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [coverPreview, setCoverPreview] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        description: '', // Editor повертатиме сюди HTML або об'єкт
        privacy_type: 'public',
        cover: null
    });

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, cover: file }));
            setCoverPreview(URL.createObjectURL(file));
        }
    };
    // Спеціальний хендлер для Editor
    const handleEditorChange = (content) => {
        setFormData(prev => ({ ...prev, description: content }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('nickname', formData.nickname);
            payload.append('privacy_type', formData.privacy_type);

            // Оскільки Editor вже віддає відформатований контент (рядок або об'єкт),
            // ми просто перетворюємо його в рядок (якщо це об'єкт) перед відправкою.
            if (formData.description) {
                const descValue = typeof formData.description === 'object'
                    ? JSON.stringify(formData.description)
                    : formData.description;

                payload.append('description', descValue);
            }

            if (formData.cover) {
                payload.append('cover_file', formData.cover);
            }

            const res = await SpaceService.createSpace(payload);
            if (res.success) {
                notifySuccess(t('spaces.created'));
                onClose();
                navigate(`/${res.data.entity.nickname}`);
            }
        } catch (error) {
            notifyError(error.response?.data?.message || 'Error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="tetrone-modal-overlay" onClick={onClose}>
            <div className="tetrone-modal-dialog" onClick={e => e.stopPropagation()}>
                <div className="tetrone-modal-header">
                    <h3>{t('spaces.create')}</h3>
                    <div className="tetrone-modal-header-actions">
                        <button className="tetrone-modal-close" onClick={onClose} title={t('action.close')}>✖</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="tetrone-modal-body">
                        <div className="form-group tetrone-mb-15">
                            <Label>{t('spaces.cover')}</Label>
                            <div
                                className="tetrone-space-cover-upload"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover Preview" className="tetrone-space-cover-preview" />
                                ) : (
                                    <span className="tetrone-space-cover-placeholder">+ {t('spaces.upload_cover')}</span>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="tetrone-hidden-input"
                                accept="image/*"
                                onChange={handleCoverChange}
                            />
                        </div>

                        <div className="form-group tetrone-mb-15">
                            <Label>{t('spaces.name')}</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className="form-group tetrone-mb-15">
                            <Label>{t('spaces.nickname')}</Label>
                            <Input
                                value={formData.nickname} 
                                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                            />
                        </div>

                        <div className="form-group tetrone-mb-15">
                            <Label>{t('spaces.description')}</Label>
                            <Editor
                                className="tetrone-form-textarea fixed-size"
                                value={formData.description}
                                onChange={handleEditorChange}
                            />
                        </div>

                        <div className="form-group tetrone-mb-15">
                            <Label>{t('spaces.info_type')}</Label>
                            <select
                                className="tetrone-select"
                                value={formData.privacy_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, privacy_type: e.target.value }))}
                            >
                                <option value="public">{t('spaces.privacy_public')}</option>
                                <option value="private">{t('spaces.privacy_private')}</option>
                                <option value="closed">{t('spaces.privacy_closed')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="tetrone-modal-footer">
                        <Button variant="secondary" onClick={onClose} type="button">
                            {t('action.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isProcessing}
                        >
                            {isProcessing ? t('common.loading') : t('action.create')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSpaceModal;