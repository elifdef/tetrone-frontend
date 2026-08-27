import { forwardRef } from 'react';

const Radio = forwardRef(({ label, className = "", ...props }, ref) => {
    return (
        <div className="flex items-center gap-[6px]">
            <div className="relative flex items-center justify-center">
                <input
                    type="radio"
                    ref={ref}
                    className={`appearance-none w-[14px] h-[14px] m-0 bg-input-bg border border-input-border rounded-full cursor-pointer align-middle checked:border-theme-link peer transition-colors ${className}`}
                    {...props}
                />
                <div className="absolute w-[6px] h-[6px] rounded-full bg-theme-link opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"></div>
            </div>
            {label && (
                <label className="text-[11px] text-text-main cursor-pointer select-none" htmlFor={props.id}>
                    {label}
                </label>
            )}
        </div>
    );
});

Radio.displayName = 'Radio';
export default Radio;