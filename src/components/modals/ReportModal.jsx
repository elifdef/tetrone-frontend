import {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import ReportService from '../../services/report.service';
import {notifySuccess, notifyError} from '../common/Notify';
import Button from '../ui/Button';
import Modal from './Modal';
import CustomSelect from '../ui/CustomSelect';

// Схема валідації
const reportSchema = z.object({
    reason:  z.string().min(1, 'errors.required'),
    details: z.string().max(1000, 'errors.max_length').optional()
});

export default function ReportModal({isOpen, onClose, targetType, targetId})
{
    const {t} = useTranslation();
    const [reasons, setReasons] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingReasons, setIsLoadingReasons] = useState(false);

    const {register, handleSubmit, control, setValue, reset, formState: {errors}} = useForm({
        resolver:      zodResolver(reportSchema),
        defaultValues: {
            reason:  '',
            details: ''
        }
    });

    useEffect(() =>
    {
        if (isOpen && reasons.length === 0)
        {
            setIsLoadingReasons(true);
            ReportService.getReasons()
            .onSuccess((res) =>
            {
                const data = res.reasons || [];
                setReasons(data);
                if (data.length > 0)
                {
                    setValue('reason', data[0]); // Встановлюємо дефолтне значення
                }
                setIsLoadingReasons(false);
            })
            .onError((err) =>
            {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                setIsLoadingReasons(false);
            });
        }
    }, [isOpen, reasons.length, setValue, t]);

    const onSubmit = (data) =>
    {
        if (!data.reason || !targetId)
        {
            notifyError(t('common.error'));
            return;
        }

        setIsSubmitting(true);
        ReportService.submitReport({
            type:    targetType,
            id:      targetId,
            reason:  data.reason,
            details: data.details
        })
        .onSuccess((res) =>
        {
            notifySuccess(res.code ? t(`api.success.${res.code}`) : t('reports.success'));
            handleClose();
            setIsSubmitting(false);
        })
        .onError((err) =>
        {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setIsSubmitting(false);
        });
    };

    const handleClose = () =>
    {
        reset(); // Очищаємо форму при закритті
        onClose();
    };

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={handleClose}>
                {t('action.cancel')}
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || isLoadingReasons}>
                {isSubmitting ? t('action.saving') : t('action.submit')}
            </Button>
        </>
    );

    // Готуємо опції для CustomSelect
    const reasonOptions = reasons.map(r => ({
        value: r,
        label: t(`reports.reasons.${r}`)
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('reports.title')}
            footer={footerButtons}
            sizeClass="modal-sm"
        >
            {isLoadingReasons ? (
                <div className="p-[20px] text-center text-text-muted italic">{t('common.loading')}</div>
            ) : (
                <form className="flex flex-col gap-[15px] font-tahoma" onSubmit={handleSubmit(onSubmit)}>

                    <div className="flex flex-col gap-[4px]">
                        <label className="text-[11px] font-bold text-text-main">
                            {t('reports.reason_label')}
                        </label>
                        <Controller
                            name="reason"
                            control={control}
                            render={({field}) => (
                                <CustomSelect
                                    options={reasonOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={t('reports.reason_label')}
                                />
                            )}
                        />
                        {errors.reason && <span className="text-theme-error text-[10px]">{t(errors.reason.message)}</span>}
                    </div>

                    <div className="flex flex-col gap-[4px]">
                        <label className="text-[11px] font-bold text-text-main">
                            {t('reports.details_label')}
                        </label>
                        <textarea
                            {...register('details')}
                            className="w-full border border-input-border bg-input-bg p-[6px] text-[11px] text-text-main focus:outline-none focus:border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)] resize-y min-h-[80px]"
                            placeholder={t('reports.details_placeholder')}
                            maxLength="1000"
                        />
                        {errors.details && <span className="text-theme-error text-[10px]">{t(errors.details.message)}</span>}
                    </div>

                </form>
            )}
        </Modal>
    );
}