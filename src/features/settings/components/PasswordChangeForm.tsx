import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import Input from '@/components/ui/Input';
import PasswordStrengthBar from '@/components/ui/PasswordStrengthBar';
import Button from '@/components/ui/Button';
import type { PasswordFormValues } from '../hooks/useSecuritySettings';

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'errors.required'),
        newPassword: z.string().min(8, 'errors.password_min_length'),
        confirmPassword: z.string().min(1, 'errors.required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'errors.passwords_do_not_match',
        path: ['confirmPassword'],
    });

export interface PasswordChangeFormProps {
    loading: boolean;
    onSubmit: (data: PasswordFormValues, resetForm?: () => void) => void;
    t: TFunction;
}

const PasswordChangeForm = ({ loading, onSubmit, t }: PasswordChangeFormProps) => {
    const [newPasswordScore, setNewPasswordScore] = useState(0);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<PasswordFormValues>({
        mode: 'onTouched',
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const newPasswordValue = watch('newPassword');

    const submitWrapper = (data: PasswordFormValues) => {
        onSubmit(data, () => {
            reset();
            setNewPasswordScore(0);
        });
    };

    return (
        <div className="p-[12px_15px] border-b border-border last:border-b-0">
            <h2 className="m-0 mb-[10px] text-[11px] font-bold text-theme-link border-b border-border pb-[4px]">
                {t('settings.change_password')}
            </h2>

            <form onSubmit={handleSubmit(submitWrapper)} noValidate className="flex flex-col">
                <div className="mb-[12px]">
                    <Input
                        label={t('settings.current_password')}
                        type="password"
                        placeholder="********"
                        {...register('currentPassword')}
                        error={
                            errors.currentPassword
                                ? t(errors.currentPassword.message || '')
                                : undefined
                        }
                    />
                </div>

                <div className="mb-[12px]">
                    <Input
                        label={t('settings.new_password')}
                        type="password"
                        placeholder="********"
                        {...register('newPassword')}
                        error={
                            errors.newPassword ? t(errors.newPassword.message || '') : undefined
                        }
                    />
                </div>

                <div className="mb-[12px]">
                    <Input
                        label={t('auth.password_confirmation')}
                        type="password"
                        placeholder="********"
                        {...register('confirmPassword')}
                        error={
                            errors.confirmPassword
                                ? t(errors.confirmPassword.message || '')
                                : undefined
                        }
                    />
                </div>

                <PasswordStrengthBar
                    password={newPasswordValue || ''}
                    onScoreChange={setNewPasswordScore}
                />

                <div className="flex justify-end mt-[5px]">
                    <Button
                        type="submit"
                        disabled={loading || (Boolean(newPasswordValue) && newPasswordScore < 5)}
                    >
                        {loading ? t('action.saving') : t('action.save')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default PasswordChangeForm;