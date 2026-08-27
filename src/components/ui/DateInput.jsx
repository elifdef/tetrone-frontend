import { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { uk, enUS } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";

// Реєструємо локалі для днів тижня і форматів
registerLocale('uk', uk);
registerLocale('en', enUS);

const DateInput = forwardRef(({ label, error, className = "", value, onChange, ...props }, ref) => {
    const { t, i18n } = useTranslation();

    const currentLocale = i18n.language === 'uk' ? 'uk' : 'en';
    const displayFormat = currentLocale === 'uk' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';

    // Tailwind класи для інпута
    const inputClass = `bg-input-bg border text-text-main p-[6px] text-[11px] w-full outline-none focus:border-theme-link transition-colors ${error ? 'border-theme-error' : 'border-input-border'} ${className}`.trim();

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

    // Генеруємо список років (від поточного і на 100 років назад)
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    // Назви місяців для нашого кастомного селекта
    const monthsUk = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthNames = currentLocale === 'uk' ? monthsUk : monthsEn;

    return (
        <div className="relative flex flex-col mb-[12px] w-full">
            {label && <label className="block mb-[4px] text-text-muted font-normal text-[11px]">{label}</label>}

            <DatePicker
                ref={ref}
                selected={parsedDate}
                onChange={handleChange}
                locale={currentLocale}
                dateFormat={displayFormat}
                className={inputClass}
                maxDate={new Date()}
                // Власний рендер шапки календаря
                renderCustomHeader={({
                                         date,
                                         changeYear,
                                         changeMonth,
                                         decreaseMonth,
                                         increaseMonth,
                                         prevMonthButtonDisabled,
                                         nextMonthButtonDisabled,
                                     }) => (
                    <div className="flex justify-between items-center bg-bg-page border-b border-border p-[6px] gap-[4px]">
                        <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="bg-transparent border-none cursor-pointer text-text-main font-bold text-[12px] hover:text-theme-link px-[4px] outline-none disabled:opacity-30 disabled:cursor-default"
                        >
                            {"<"}
                        </button>

                        {/* СПОЧАТКУ РІК */}
                        <select
                            value={date.getFullYear()}
                            onChange={({ target: { value } }) => changeYear(Number(value))}
                            className="bg-input-bg border border-input-border text-text-main text-[11px] p-[2px] outline-none cursor-pointer"
                        >
                            {years.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>

                        {/* ПОТІМ МІСЯЦЬ */}
                        <select
                            value={monthNames[date.getMonth()]}
                            onChange={({ target: { value } }) => changeMonth(monthNames.indexOf(value))}
                            className="flex-1 bg-input-bg border border-input-border text-text-main text-[11px] p-[2px] outline-none cursor-pointer"
                        >
                            {monthNames.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="bg-transparent border-none cursor-pointer text-text-main font-bold text-[12px] hover:text-theme-link px-[4px] outline-none disabled:opacity-30 disabled:cursor-default"
                        >
                            {">"}
                        </button>
                    </div>
                )}
                {...props}
            />

            {error && (
                <span className="text-theme-error text-[10px] mt-[4px] block">
                    {error.message || error}
                </span>
            )}
        </div>
    );
});

DateInput.displayName = 'DateInput';
export default DateInput;