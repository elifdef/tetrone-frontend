import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import supportService from '../../services/support.service';
import Button from "../ui/Button.jsx";
import CustomSelect from "../ui/CustomSelect.jsx";
import Textarea from "../ui/Textarea.jsx";
import ImagePreviewModal from "../ui/ImagePreviewModal.jsx";

const SupportTicketForm = ({ onCancel, onSuccess }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState(null);

    const [previewImage, setPreviewImage] = useState(null);

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

    // Очистка URL з пам'яті
    useEffect(() => {
        return () => {
            form.attachments.forEach(att => URL.revokeObjectURL(att.previewUrl));
        };
    }, [form.attachments]);

    const handleChange = (field, value) => {
        setErrors(prev => ({ ...prev, [field]: null }));
        setGlobalError(null);

        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'category') {
                updated.subcategory = '';
                updated.steps_to_reproduce = '';
            }
            return updated;
        });
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setGlobalError(null);

        const availableSlots = 5 - form.attachments.length;
        const allowedFiles = files.slice(0, availableSlots);

        const newAttachments = allowedFiles.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setForm(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...newAttachments]
        }));

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (indexToRemove) => {
        setForm(prev => {
            const attToRemove = prev.attachments[indexToRemove];
            URL.revokeObjectURL(attToRemove.previewUrl);

            return {
                ...prev,
                attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
            };
        });
    };

    const validateForm = () => {
        let newErrors = {};

        if (form.subject.length < 16 || form.subject.length > 256) {
            newErrors.subject = t('support.val_subject_len', { min: 16, max: 256 });
        }
        if (form.message.length < 32 || form.message.length > 1024) {
            newErrors.message = t('support.val_message_len', { min: 32, max: 1024 });
        }
        if (form.category === 'bug_report' && (form.steps_to_reproduce.length < 32 || form.steps_to_reproduce.length > 1024)) {
            newErrors.steps_to_reproduce = t('support.val_steps_len', { min: 32, max: 1024 });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setGlobalError(null);

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
                form.attachments.forEach(att => {
                    formData.append('attachments[]', att.file);
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
            setGlobalError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const currentCatObj = categories.find(c => c.id === form.category);
    const currentSubcategories = currentCatObj?.subcategories || [];

    const categoryOptions = categories.map(c => ({ value: c.id, label: t(`support.cat_${c.id}`) }));
    const subcategoryOptions = currentSubcategories.map(sub => ({ value: sub, label: t(`support.subcat_${sub}`) }));

    return (
        <div>
            <div className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border max-md:-mt-[10px] max-md:-mx-[10px]">
                {t('support.create_ticket')}
            </div>

            <div>
                {globalError && (
                    <div className="bg-[rgba(255,51,71,0.1)] border border-[#ff3347] p-[8px] text-[11px] text-[#ff3347] mb-[15px] font-bold">
                        ✖ {globalError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-[15px]">

                    <div>
                        <label className="block font-bold text-[11px] mb-[4px] text-text-muted">{t('support.field_category')}</label>
                        <CustomSelect
                            options={categoryOptions}
                            value={form.category}
                            onChange={(val) => handleChange('category', val)}
                            placeholder={t('common.loading')}
                        />
                    </div>

                    {currentSubcategories.length > 0 && (
                        <div>
                            <label className="block font-bold text-[11px] mb-[4px] text-text-muted">{t('support.field_subcategory')}</label>
                            <CustomSelect
                                options={subcategoryOptions}
                                value={form.subcategory}
                                onChange={(val) => handleChange('subcategory', val)}
                                placeholder={t('support.select_subcategory')}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block font-bold text-[11px] mb-[4px] text-text-muted">{t('support.field_subject')}</label>
                        <input
                            type="text"
                            className={`w-full h-[28px] px-[8px] border bg-input-bg text-text-main text-[11px] transition-colors focus:outline-none ${errors.subject ? 'border-theme-error focus:border-theme-error' : 'border-input-border focus:border-theme-link'}`}
                            value={form.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            placeholder={t('support.subject_placeholder')}
                        />
                        {errors.subject && <div className="text-[10px] text-theme-error mt-[4px]">{errors.subject}</div>}
                    </div>

                    {form.category === 'bug_report' && (
                        <div className="bg-[rgba(255,204,0,0.05)] border border-[#e5a43b] p-[8px] text-[11px] text-text-main">
                            <strong className="text-[#e5a43b]">!</strong> {t('support.bug_report_warning')}
                        </div>
                    )}

                    <Textarea
                        label={t('support.field_message')}
                        value={form.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        placeholder={t('support.message_placeholder')}
                        error={errors.message}
                        className="text-[11px] h-[100px]"
                    />

                    {form.category === 'bug_report' && (
                        <Textarea
                            label={t('support.field_steps')}
                            value={form.steps_to_reproduce}
                            onChange={(e) => handleChange('steps_to_reproduce', e.target.value)}
                            error={errors.steps_to_reproduce}
                            className="text-[11px] h-[80px]"
                        />
                    )}

                    <div>
                        <label className="block font-bold text-[11px] mb-[4px] text-text-muted">{t('support.field_attachments')} ({form.attachments.length}/5)</label>
                        <div className="flex items-center gap-[10px]">
                            <input
                                type="file"
                                id="ticket-files"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                ref={fileInputRef}
                                disabled={form.attachments.length >= 5}
                            />
                            <label
                                htmlFor="ticket-files"
                                className={`bg-bg-box border border-border px-[10px] py-[6px] transition-colors font-bold text-[11px] ${form.attachments.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-bg-hover hover:border-theme-link text-theme-link'}`}
                            >
                                {t('action.attach')}
                            </label>
                        </div>

                        {form.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-[8px] mt-[10px]">
                                {form.attachments.map((att, index) => (
                                    <div
                                        key={index}
                                        className="relative w-[50px] h-[50px] border border-border bg-[rgba(128,128,128,0.05)] group cursor-zoom-in"
                                        onClick={() => setPreviewImage(att.previewUrl)}
                                    >
                                        <img src={att.previewUrl} className="w-full h-full object-cover" alt="upload" />

                                        <button
                                            type="button"
                                            className="absolute top-0 right-0 bg-[rgba(0,0,0,0.6)] text-white w-[16px] h-[16px] flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ff3347] border-none cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            title={t('action.delete')}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-[10px] pt-[15px] border-t border-border mt-[5px]">
                        <Button variant="secondary" onClick={onCancel} disabled={loading} type="button">
                            {t('action.cancel')}
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? t('common.loading') : t('action.submit')}
                        </Button>
                    </div>
                </form>
            </div>

            <ImagePreviewModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage}
            />
        </div>
    );
};

export default SupportTicketForm;