import { forwardRef } from 'react';

const Checkbox = forwardRef(({ label, className = "", ...props }, ref) => {
    return (
        <div className="flex items-center gap-[6px]">
            <div className="relative flex items-center justify-center">
                <input
                    type="checkbox"
                    ref={ref}
                    className={`appearance-none w-4 h-4 m-0 bg-input-bg border border-input-border rounded-[3px] cursor-pointer align-middle checked:bg-theme-link checked:border-theme-link peer transition-colors ${className}`}
                    {...props}
                />
                {/* SVG Галочка, яка з'являється тільки при peer-checked */}
                <svg
                    className="absolute w-[10px] h-[10px] pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            {label && (
                <label className="text-[11px] text-text-main cursor-pointer select-none" htmlFor={props.id}>
                    {label}
                </label>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';
export default Checkbox;