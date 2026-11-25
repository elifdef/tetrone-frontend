import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Radio from '@/components/ui/Radio';

export interface GenderSelectProps {
    name?: string;
    value: number | string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    error?: string;
    required?: boolean;
}

const GenderSelect = ({
    name = 'gender',
    value,
    onChange,
    label,
    error,
    required = false,
}: GenderSelectProps) => {
    const { t } = useTranslation();

    return (
        <div className="mb-[12px] relative">
            {label && (
                <label className="block mb-[4px] text-text-muted font-normal text-[11px]">
                    {label}
                </label>
            )}

            <div className="flex items-center gap-[15px] mt-[4px]">
                <label className="flex items-center gap-[6px] cursor-pointer text-[11px] text-text-main select-none">
                    <Radio
                        type="radio"
                        name={name}
                        value="1"
                        checked={Number(value) === 1}
                        onChange={onChange}
                        required={required}
                        className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer"
                    />
                    {t('common.male')}
                </label>

                <label className="flex items-center gap-[6px] cursor-pointer text-[11px] text-text-main select-none">
                    <Radio
                        type="radio"
                        name={name}
                        value="2"
                        checked={Number(value) === 2}
                        onChange={onChange}
                        required={required}
                        className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer"
                    />
                    {t('common.female')}
                </label>
            </div>

            {error && (
                <span className="text-theme-error text-[10px] mt-[4px] block">
                    {error}
                </span>
            )}
        </div>
    );
};

export default GenderSelect;