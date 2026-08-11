import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import supportService from '../../services/support.service';
import Button from "../ui/Button.jsx";

const SupportTicketForm = ({ onCancel, onSuccess }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [form, setForm] = useState({
        category: '',
        subcategory: '',
        subject: '',
        message: '',
        steps_to_reproduce: '',
        attachments: []
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await supportService.getCategories();
                const fetchedCats = res.categories || [];
                setCategories(fetchedCats);
                if (fetchedCats.length > 0) {
                    setForm(prev => ({ ...prev, category: fetchedCats[0].id }));
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
            if (field === 'category') {
                updated.subcategory = '';
                updated.steps_to_reproduce = '';
                updated.attachments = [];
            }
            return updated;
        });
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setErrorMessage(null);
        setForm(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files].slice(0, 5)
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
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

            if (form.subcategory) {
                formData.append('subcategory', form.subcategory);
            }

            if (form.steps_to_reproduce) {
                formData.append('meta[steps_to_reproduce]', form.steps_to_reproduce);
            }

            if (form.attachments.length > 0) {
                form.attachments.forEach(file => {
                    formData.append('attachments[]', file);
                });
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

    const currentCatObj = categories.find(c => c.id === form.category);
    const currentSubcategories = currentCatObj?.subcategories || [];

    return (
        <div className="tetrone-support-block">
            <div className="tetrone-support-block-header">{t('support.create_ticket')}</div>

            <div className="tetrone-support-block-content">
                {errorMessage && (
                    <div className="tetrone-support-error-box">
                        <b>✖</b> {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="tetrone-support-form-row">
                        <label className="tetrone-support-label">{t('support.field_category')}</label>
                        <select
                            className="tetrone-support-input"
                            value={form.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            required
                        >
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{t(`support.cat_${c.id}`)}</option>
                            ))}
                        </select>
                    </div>

                    {currentSubcategories.length > 0 && (
                        <div className="tetrone-support-form-row">
                            <label className="tetrone-support-label">{t('support.field_subcategory')}</label>
                            <select
                                className="tetrone-support-input"
                                value={form.subcategory}
                                onChange={(e) => handleChange('subcategory', e.target.value)}
                                required
                            >
                                <option value="">{t('support.select_subcategory')}</option>
                                {currentSubcategories.map(sub => (
                                    <option key={sub} value={sub}>{t(`support.subcat_${sub}`)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="tetrone-support-form-row">
                        <label className="tetrone-support-label">{t('support.field_subject')}</label>
                        <input
                            type="text"
                            className="tetrone-support-input"
                            value={form.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            required
                        />
                    </div>

                    {form.category === 'bug_report' && (
                        <div className="tetrone-support-warning-box">
                            <b>!</b> {t('support.bug_report_warning')}
                        </div>
                    )}

                    <div className="tetrone-support-form-row">
                        <label className="tetrone-support-label">{t('support.field_message')}</label>
                        <textarea
                            className="tetrone-support-textarea"
                            value={form.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            placeholder={t('support.message_placeholder')}
                            required
                        />
                        <div className="tetrone-support-error-text" style={{ textAlign: 'right' }}>
                            {form.message.length > 0 && form.message.length < 10 ? t('support.min_10_chars') : ''}
                        </div>
                    </div>

                    {form.category === 'bug_report' && (
                        <div className="tetrone-support-form-row">
                            <label className="tetrone-support-label">{t('support.field_steps')}</label>
                            <textarea
                                className="tetrone-support-textarea"
                                value={form.steps_to_reproduce}
                                onChange={(e) => handleChange('steps_to_reproduce', e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="tetrone-support-form-row">
                        <label className="tetrone-support-label">{t('support.field_attachments')}</label>
                        <div>
                            <input
                                type="file"
                                id="ticket-files"
                                multiple
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                                ref={fileInputRef}
                            />
                            <label htmlFor="ticket-files" className="tetrone-classic-btn tetrone-classic-btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                                {t('action.attach')}
                            </label>
                        </div>

                        {form.attachments.length > 0 && (
                            <div className="tetrone-support-attachments-list">
                                {form.attachments.map((file, index) => (
                                    <div key={index} className="tetrone-support-attach-item">
                                        <span>{file.name}</span>
                                        <Button onClick={() => removeFile(index)}>✕</Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="tetrone-support-form-footer">
                        <Button variant={"secondary"} onClick={onCancel} disabled={loading}>
                            {t('action.cancel')}
                        </Button>
                        <Button variant={"primary"} disabled={loading}>
                            {loading ? t('common.loading') : t('action.submit')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupportTicketForm;