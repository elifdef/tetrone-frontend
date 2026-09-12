import { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { uk, enUS } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('uk', uk);
registerLocale('en', enUS);

const DateInput = forwardRef(({ label, error, className = "", value, onChange, ...props }, ref) => {
    const { t, i18n } = useTranslation();

    const currentLocale = i18n.language === 'uk' ? 'uk' : 'en';
    const displayFormat = currentLocale === 'uk' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';

    const parsedDate = value ? new Date(value) : null;

    const handleChange = (date) => {
        if (!date) {
            onChange({ target: { name: props.name, value: '' } });
            return;
        }
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        onChange({ target: { name: props.name, value: `${yyyy}-${mm}-${dd}` } });
    };

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    const monthNames = [
        t('date.months.jan'), t('date.months.feb'), t('date.months.mar'),
        t('date.months.apr'), t('date.months.may'), t('date.months.jun'),
        t('date.months.jul'), t('date.months.aug'), t('date.months.sep'),
        t('date.months.oct'), t('date.months.nov'), t('date.months.dec')
    ];

    // Додано ! (important) для гарантованого перебивання дефолтного білого CSS бібліотеки
    // та !rounded-none для суворої квадратності
    const wrapperClasses = `
        relative flex flex-col w-full font-tahoma
        [&_.react-datepicker]:!rounded-none
        [&_.react-datepicker]:!border
        [&_.react-datepicker]:!border-border
        [&_.react-datepicker]:!bg-bg-box
        [&_.react-datepicker]:!font-tahoma
        [&_.react-datepicker]:!shadow-[0_2px_4px_rgba(0,0,0,0.1)]
        [&_.react-datepicker__header]:!bg-header-bg
        [&_.react-datepicker__header]:!border-b
        [&_.react-datepicker__header]:!border-border
        [&_.react-datepicker__header]:!rounded-none
        [&_.react-datepicker__header]:!pt-[5px]
        [&_.react-datepicker__day-name]:!text-text-muted
        [&_.react-datepicker__day-name]:!font-bold
        [&_.react-datepicker__day-name]:!text-[10px]
        [&_.react-datepicker__day]:!text-text-main
        [&_.react-datepicker__day]:!rounded-none
        [&_.react-datepicker__day]:!text-[11px]
        [&_.react-datepicker__day:hover]:!bg-header-bg
        [&_.react-datepicker__day:hover]:!text-theme-link
        [&_.react-datepicker__day--selected]:!bg-theme-link
        [&_.react-datepicker__day--selected]:!text-white
        [&_.react-datepicker__day--selected]:!font-bold
        [&_.react-datepicker__day--keyboard-selected:not(.react-datepicker__day--selected)]:!bg-transparent
        [&_.react-datepicker__triangle]:!hidden
    `.replace(/\s+/g, ' ').trim();

    return (
        <div className={wrapperClasses}>
            {label && (
                <label className="block mb-[4px] font-normal text-[11px] text-text-muted" htmlFor={props.id}>
                    {label}
                </label>
            )}

            <DatePicker
                ref={ref}
                selected={parsedDate}
                onChange={handleChange}
                locale={currentLocale}
                dateFormat={displayFormat}
                className={`bg-input-bg border border-input-border text-text-main p-[4px_6px] text-[11px] w-full rounded-none outline-none focus:border-theme-link transition-colors shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] ${error ? 'border-theme-error' : ''} ${className}`}
                maxDate={new Date()}
                isClearable={true}
                placeholderText={t('common.date')}
                renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                    <div className="flex justify-between items-center px-[4px] pb-[4px] gap-[4px] bg-header-bg border-b border-border pt-[5px] rounded-none">
                        <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="bg-transparent border-none cursor-pointer text-theme-link font-bold text-[12px] hover:underline px-[4px] outline-none disabled:opacity-30 rounded-none">
                            {"<"}
                        </button>

                        <select value={date.getFullYear()} onChange={({ target: { value } }) => changeYear(Number(value))} className="bg-input-bg border border-input-border text-text-main text-[11px] p-[2px] outline-none cursor-pointer focus:border-theme-link rounded-none">
                            {years.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>

                        <select value={date.getMonth()} onChange={({ target: { value } }) => changeMonth(Number(value))} className="flex-1 bg-input-bg border border-input-border text-text-main text-[11px] p-[2px] outline-none cursor-pointer focus:border-theme-link rounded-none">
                            {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
                        </select>

                        <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="bg-transparent border-none cursor-pointer text-theme-link font-bold text-[12px] hover:underline px-[4px] outline-none disabled:opacity-30 rounded-none">
                            {">"}
                        </button>
                    </div>
                )}
                {...props}
            />
        </div>
    );
});

DateInput.displayName = 'DateInput';
export default DateInput;