import { useState, useRef, useEffect, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

const cleanIsoDate = (val) => {
    if (!val || typeof val !== 'string') return '';
    return val.split('T')[0].split(' ')[0].trim();
};

const formatDisplayDate = (isoStr, locale) => {
    const cleanStr = cleanIsoDate(isoStr);
    if (!cleanStr) return '';

    const parts = cleanStr.split('-');
    if (parts.length !== 3) return '';
    const [y, m, d] = parts;
    return locale === 'uk' ? `${d}.${m}.${y}` : `${m}/${d}/${y}`;
};

const parseInputToIso = (text, locale) => {
    if (!text) return '';
    const cleaned = text.trim();
    const delimiter = cleaned.includes('.') ? '.' : cleaned.includes('/') ? '/' : '-';
    const parts = cleaned.split(delimiter);

    if (parts.length !== 3) return null;

    let y, m, d;
    if (delimiter === '-') {
        [y, m, d] = parts;
    } else if (locale === 'uk') {
        [d, m, y] = parts;
    } else {
        [m, d, y] = parts;
    }

    const yearNum = Number(y);
    const monthNum = Number(m);
    const dayNum = Number(d);

    if (!yearNum || !monthNum || !dayNum) return null;
    if (monthNum < 1 || monthNum > 12) return null;
    if (dayNum < 1 || dayNum > 31) return null;

    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (
        date.getFullYear() !== yearNum ||
        date.getMonth() !== monthNum - 1 ||
        date.getDate() !== dayNum
    ) {
        return null;
    }

    const mm = String(monthNum).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${yearNum}-${mm}-${dd}`;
};

const DateInput = forwardRef(({ label, error, className = "", value = "", onChange, name, id, disabled, required, ...props }, ref) => {
    const { t, i18n } = useTranslation();
    const containerRef = useRef(null);

    const currentLocale = i18n.language === 'uk' ? 'uk' : 'en';

    const [isOpen, setIsOpen] = useState(false);
    const [textValue, setTextValue] = useState(() => formatDisplayDate(value, currentLocale));

    const initialDate = value ? new Date(value) : new Date();
    const [viewDate, setViewDate] = useState(() => (!isNaN(initialDate.getTime()) ? initialDate : new Date()));

    useEffect(() => {
        setTextValue(formatDisplayDate(value, currentLocale));
        if (value) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                setViewDate(d);
            }
        }
    }, [value, currentLocale]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setTextValue(formatDisplayDate(value, currentLocale));
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, value, currentLocale]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setTextValue(val);

        if (!val.trim()) {
            onChange?.({ target: { name, value: '' } });
            return;
        }

        const parsedIso = parseInputToIso(val, currentLocale);
        if (parsedIso) {
            onChange?.({ target: { name, value: parsedIso } });
            const d = new Date(parsedIso);
            if (!isNaN(d.getTime())) {
                setViewDate(d);
            }
        }
    };

    const handleSelectDate = (year, month, day) => {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const iso = `${year}-${mm}-${dd}`;

        onChange?.({ target: { name, value: iso } });
        setTextValue(formatDisplayDate(iso, currentLocale));
        setIsOpen(false);
    };

    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    const monthNames = [
        t('date.months.jan'), t('date.months.feb'), t('date.months.mar'),
        t('date.months.apr'), t('date.months.may'), t('date.months.jun'),
        t('date.months.jul'), t('date.months.aug'), t('date.months.sep'),
        t('date.months.oct'), t('date.months.nov'), t('date.months.dec')
    ];

    const weekDays = [
        t('date.days.mon'), t('date.days.tue'), t('date.days.wed'),
        t('date.days.thu'), t('date.days.fri'), t('date.days.sat'),
        t('date.days.sun')
    ];

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const calendarCells = [];

    for (let i = startDayIndex - 1; i >= 0; i--) {
        calendarCells.push({
            year: viewMonth === 0 ? viewYear - 1 : viewYear,
            month: viewMonth === 0 ? 11 : viewMonth - 1,
            day: daysInPrevMonth - i,
            isCurrentMonth: false,
        });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
        calendarCells.push({
            year: viewYear,
            month: viewMonth,
            day: i,
            isCurrentMonth: true,
        });
    }

    const remainingCells = 42 - calendarCells.length;
    for (let i = 1; i <= remainingCells; i++) {
        calendarCells.push({
            year: viewMonth === 11 ? viewYear + 1 : viewYear,
            month: viewMonth === 11 ? 0 : viewMonth + 1,
            day: i,
            isCurrentMonth: false,
        });
    }

    const today = new Date();
    const isToday = (y, m, d) => (
        today.getFullYear() === y &&
        today.getMonth() === m &&
        today.getDate() === d
    );

    const isSelected = (y, m, d) => {
        if (!value) return false;
        const selectedParts = value.split('-');
        if (selectedParts.length !== 3) return false;
        return (
            Number(selectedParts[0]) === y &&
            Number(selectedParts[1]) === m + 1 &&
            Number(selectedParts[2]) === d
        );
    };

    return (
        <div ref={containerRef} className="relative flex flex-col w-full font-tahoma text-[11px] select-none">
            {label && (
                <label className="block mb-[4px] font-normal text-[11px] text-text-muted" htmlFor={id}>
                    {label}
                </label>
            )}

            <div className="relative flex items-center w-full">
                <input
                    ref={ref}
                    id={id}
                    name={name}
                    type="text"
                    disabled={disabled}
                    required={required}
                    value={textValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={currentLocale === 'uk' ? 'ДД.ММ.РРРР' : 'MM/DD/YYYY'}
                    autoComplete="off"
                    className={`bg-input-bg border border-input-border text-text-main p-[4px_6px] pr-[22px] text-[11px] w-full rounded-none outline-none focus:border-theme-link shadow-[inset_1px_1px_1px_rgba(0,0,0,0.08)] ${error ? 'border-theme-error' : ''} ${className}`}
                    {...props}
                />

                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange?.({ target: { name, value: '' } });
                            setTextValue('');
                        }}
                        className="absolute right-[4px] text-text-muted hover:text-text-main text-[13px] bg-transparent border-none cursor-pointer leading-none p-[2px] rounded-none"
                    >
                        ×
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+2px)] left-0 z-[9999] bg-bg-box border border-border rounded-none shadow-[0_2px_4px_rgba(0,0,0,0.25)] p-[4px] w-[215px]">
                    <div className="flex items-center justify-between gap-[3px] bg-header-bg p-[3px] border-b border-border rounded-none">
                        <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="bg-transparent border border-transparent hover:border-border text-theme-link font-bold text-[11px] px-[4px] py-[1px] cursor-pointer rounded-none leading-none select-none"
                        >
                            «
                        </button>

                        <div className="flex gap-[3px] flex-1">
                            <select
                                value={viewMonth}
                                onChange={(e) => setViewDate(new Date(viewYear, Number(e.target.value), 1))}
                                className="flex-1 bg-input-bg border border-input-border text-text-main text-[11px] py-[1px] px-[2px] outline-none cursor-pointer focus:border-theme-link rounded-none"
                            >
                                {monthNames.map((mName, idx) => (
                                    <option key={idx} value={idx}>{mName}</option>
                                ))}
                            </select>

                            <select
                                value={viewYear}
                                onChange={(e) => setViewDate(new Date(Number(e.target.value), viewMonth, 1))}
                                className="w-[62px] bg-input-bg border border-input-border text-text-main text-[11px] py-[1px] px-[2px] outline-none cursor-pointer focus:border-theme-link rounded-none"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="bg-transparent border border-transparent hover:border-border text-theme-link font-bold text-[11px] px-[4px] py-[1px] cursor-pointer rounded-none leading-none select-none"
                        >
                            »
                        </button>
                    </div>

                    <div className="grid grid-cols-7 text-center font-bold text-text-muted text-[10px] py-[3px] border-b border-border bg-header-bg rounded-none">
                        {weekDays.map((dName, idx) => (
                            <div key={idx} className="w-[28px] leading-[18px]">
                                {dName}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 text-center mt-[2px] gap-y-[1px]">
                        {calendarCells.map((cell, idx) => {
                            const selected = isSelected(cell.year, cell.month, cell.day);
                            const currentDay = isToday(cell.year, cell.month, cell.day);

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectDate(cell.year, cell.month, cell.day)}
                                    className={`
                                        w-[28px] h-[20px] leading-[20px] text-[11px] rounded-none border border-transparent cursor-pointer p-0 select-none
                                        ${selected ? '!bg-theme-link !text-white !font-bold !border-theme-link' : ''}
                                        ${!selected && currentDay ? '!border-border font-bold' : ''}
                                        ${!selected && cell.isCurrentMonth ? 'text-text-main hover:bg-header-bg hover:text-theme-link' : ''}
                                        ${!selected && !cell.isCurrentMonth ? 'text-text-muted opacity-30 hover:bg-header-bg' : ''}
                                    `}
                                >
                                    {cell.day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

DateInput.displayName = 'DateInput';
export default DateInput;