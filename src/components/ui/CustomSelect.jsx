import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ options, value, onChange, placeholder, className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`flex items-center gap-[8px] bg-input-bg border h-[28px] px-[8px] box-border cursor-pointer select-none w-full overflow-hidden transition-colors ${isOpen ? 'border-input-border !border-b-transparent' : 'border-input-border hover:border-theme-link'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-[11px] ${selectedOption ? 'text-text-main' : 'text-text-muted'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <span className="ml-auto text-[9px] text-text-muted flex-shrink-0">
                    {isOpen ? '▲' : '▼'}
                </span>
            </div>

            {isOpen && (
                <ul className="absolute top-[100%] left-0 right-0 max-h-[200px] overflow-y-auto bg-input-bg border border-border border-t-0 z-[1000] m-0 p-0 list-none shadow-[2px_2px_4px_rgba(0,0,0,0.2)]">
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            className={`flex items-center gap-[8px] p-[6px_8px] cursor-pointer text-[11px] border-b border-border last:border-b-0 transition-colors ${String(value) === String(opt.value) ? 'bg-bg-page font-bold text-text-main' : 'text-text-main hover:bg-bg-hover'}`}
                        >
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis">{opt.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}