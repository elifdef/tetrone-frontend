import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import supportService from '../../services/support.service';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

const SupportTicketForm = ({ onCancel, onSuccess }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [form, setForm] = useState({
        category: '',
        subcategory: '',
        subject: '',
        message: '',
        steps_to_reproduce: '',
        attachments: [] // Тут тепер зберігаємо масив File об'єктів
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await supportService.getCategories();
                setCategories(res.data.categories || []);
                setSubcategories(res.data.subcategories || []);
                if (res.data.categories?.length > 0) {
                    setForm(prev => ({ ...prev, category: res.data.categories[0].id }));
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (field, value) => {
        setErrorMessage(null);
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'category' && value !== 'bug_report') {
                updated.subcategory = '';
                updated.steps_to_reproduce = '';
                updated.attachments = [];
            }
            return updated;
        });
    };

    // 🚨 ЛОГІКА ДЛЯ ФАЙЛІВ 🚨
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setErrorMessage(null);
        
        // Додаємо нові файли до вже існуючих (максимум 5 штук, наприклад)
        setForm(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files].slice(0, 5) 
        }));

        // Очищаємо інпут, щоб можна було вибрати той самий файл ще раз, якщо треба
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (indexToRemove) => {
        setForm(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.message.trim().length < 10) {
            return setErrorMessage(t('support.min_10_chars'));
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const formData = new FormData();
            formData.append('category', form.category);
            formData.append('subject', form.subject);
            formData.append('message', form.message);

            if (form.category === 'bug_report') {
                if (form.subcategory) formData.append('subcategory', form.subcategory);
                formData.append('meta[steps_to_reproduce]', form.steps_to_reproduce);
                
                // 🚨 ФІКС ДЛЯ БЕКЕНДУ: додаємо файли по одному 🚨
                if (form.attachments.length > 0) {
                    form.attachments.forEach(file => {
                        formData.append('attachments[]', file);
                    });
                }
            }

            await supportService.createTicket(formData);
            onSuccess();
        } catch (error) {
            let errMsg = error.message || t('common.error');
            
            if (error.data && error.data.errors) {
                const firstErrorKey = Object.keys(error.data.errors)[0];
                errMsg = error.data.errors[firstErrorKey][0];
            }
            
            setErrorMessage(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tetrone-support-form-wrapper">
            <h2 className="tetrone-support-content-title">{t('support.create_ticket')}</h2>

            {errorMessage && (
                <div className="tetrone-support-error-box">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="tetrone-support-form-body">
                <fieldset className="tetrone-support-fieldset">
                    <legend className="tetrone-support-legend">{t('support.fieldset_general')}</legend>

                    <div className="tetrone-input-group">
                        <label className="tetrone-label">{t('support.field_category')}</label>
                        <select
                            className="tetrone-form-select"
                            value={form.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            required
                        >
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{t(c.name_key)}</option>
                            ))}
                        </select>
                    </div>

                    {form.category === 'bug_report' && (
                        <div className="tetrone-input-group">
                            <label className="tetrone-label">{t('support.field_subcategory')}</label>
                            <select
                                className="tetrone-form-select"
                                value={form.subcategory}
                                onChange={(e) => handleChange('subcategory', e.target.value)}
                                required
                            >
                                <option value="">{t('support.select_subcategory')}</option>
                                {subcategories.map(s => (
                                    <option key={s.id} value={s.id}>{t(s.name_key)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="tetrone-input-group">
                        <Input
                            label={t('support.field_subject')}
                            value={form.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            required
                        />
                    </div>
                </fieldset>

                <fieldset className="tetrone-support-fieldset">
                    <legend className="tetrone-support-legend">{t('support.fieldset_details')}</legend>

                    {form.category === 'bug_report' && (
                        <div className="tetrone-support-info-box">
                            <div className="tetrone-support-info-box-icon">!</div>
                            <div>{t('support.bug_report_warning')}</div>
                        </div>
                    )}

                    <div className="tetrone-input-group">
                        <Textarea
                            label={t('support.field_message')}
                            value={form.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            placeholder={t('support.message_placeholder')}
                            required
                        />
                        <div className="tetrone-support-char-count">
                            {form.message.length > 0 && form.message.length < 10 ? t('support.min_10_chars') : ''}
                        </div>
                    </div>

                    {form.category === 'bug_report' && (
                        <>
                            <div className="tetrone-input-group">
                                <Textarea
                                    label={t('support.field_steps')}
                                    value={form.steps_to_reproduce}
                                    onChange={(e) => handleChange('steps_to_reproduce', e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="tetrone-input-group">
                                <label className="tetrone-label">{t('support.field_attachments')}</label>
                                
                                <div className="tetrone-file-upload-wrapper">
                                    <input 
                                        type="file" 
                                        id="ticket-files" 
                                        multiple 
                                        accept="image/*"
                                        className="tetrone-hidden-file-input"
                                        onChange={handleFileSelect}
                                        ref={fileInputRef}
                                    />
                                    <label htmlFor="ticket-files" className="tetrone-btn tetrone-btn-secondary">
                                        📁 {t('action.attach')}
                                    </label>
                                </div>

                                {/* Прев'ю обраних файлів */}
                                {form.attachments.length > 0 && (
                                    <div className="tetrone-selected-files-list">
                                        {form.attachments.map((file, index) => (
                                            <div key={index} className="tetrone-selected-file-item">
                                                <span className="tetrone-file-name">{file.name}</span>
                                                <button 
                                                    type="button" 
                                                    className="tetrone-remove-file-btn"
                                                    onClick={() => removeFile(index)}
                                                    title={t('action.remove')}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </fieldset>

                <div className="tetrone-support-form-actions">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                        {t('action.cancel')}
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {t('action.submit')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SupportTicketForm;