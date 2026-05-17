import { forwardRef } from 'react';

const Textarea = forwardRef(({ label, className = "", error, ...props }, ref) => {
    return (
        <div className="tetrone-form-group-wrapper" style={{ marginBottom: '10px', width: '100%' }}>
            {label && (
                <label className="tetrone-form-label" htmlFor={props.id}>
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                className={`tetrone-form-input ${error ? 'error-border' : ''} ${className}`}
                style={{ resize: 'vertical', minHeight: '80px', width: '100%' }}
                {...props}
            />
            {error && (
                <span style={{ color: 'var(--theme-error)', fontSize: '10px', marginTop: '4px', display: 'block' }}>
                    {error.message}
                </span>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';
export default Textarea;