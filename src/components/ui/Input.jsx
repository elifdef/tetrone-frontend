import { useState, forwardRef } from 'react';

const Input = forwardRef(({ label, className = "", type, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    // Класичний дизайн 2007: жорсткі кути, 11px шрифт, малі відступи
    const baseInputStyles = "w-full p-[6px] border bg-input-bg text-text-main text-[11px] outline-none transition-colors";

    const borderStyles = error
        ? "border-theme-error"
        : "border-input-border hover:border-theme-link focus:border-theme-link";

    const paddingStyles = isPassword ? "pr-[24px]" : "";

    const inputClass = `${baseInputStyles} ${borderStyles} ${paddingStyles} ${className}`.trim();

    return (
        <div className="w-full">
            {label && (
                <label className="block mb-[4px] font-normal text-[11px] text-text-muted" htmlFor={props.id}>
                    {label}
                </label>
            )}

            {isPassword ? (
                <div className="relative flex items-center w-full">
                    <input
                        ref={ref}
                        type={inputType}
                        className={inputClass}
                        {...props}
                    />
                    <button
                        type="button"
                        className="absolute right-[4px] flex items-center justify-center p-[4px] bg-transparent border-none cursor-pointer text-text-muted hover:text-theme-link transition-colors outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                        title={showPassword ? "Сховати" : "Показати"}
                    >
                        {showPassword ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        )}
                    </button>
                </div>
            ) : (
                <input
                    ref={ref}
                    type={inputType}
                    className={inputClass}
                    {...props}
                />
            )}

            {error && (
                <span className="block mt-[4px] text-[10px] text-theme-error">
                    {error.message || error}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;