import { forwardRef } from 'react';

const Textarea = forwardRef(({ label, className = "", error, ...props }, ref) => {
    const baseStyles = "w-full px-[10px] py-[8px] border bg-input-bg text-text-main text-[13px] rounded transition-colors duration-200 focus:outline-none resize-y min-h-[80px]";

    const borderStyles = error
        ? "border-theme-error focus:border-theme-error"
        : "border-input-border focus:border-theme-link";

    const textareaClass = `${baseStyles} ${borderStyles} ${className}`.trim();

    return (
        <div className="w-full">
            {label && (
                <label className="block mb-1 font-bold text-[11px] text-text-muted" htmlFor={props.id}>
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                className={textareaClass}
                {...props}
            />
            {error && (
                <span className="block mt-[5px] text-[12px] text-theme-error">
                    {error.message || error}
                </span>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';
export default Textarea;