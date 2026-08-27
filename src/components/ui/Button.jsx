const Button = ({ children, className = "", variant = "primary", disabled = false, ...props }) => {
    // Базові стилі для всіх кнопок: шрифт, відступи (5px 12px), центрування
    // Для ефекту натискання (active) міняємо паддінги: верхній 6px, нижній 4px + тінь
    const baseStyles = "inline-block px-[12px] py-[5px] font-tahoma text-[11px] font-bold text-center no-underline cursor-pointer box-border outline-none transition-colors duration-100 select-none active:pt-[6px] active:pb-[4px] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]";

    // Специфічні стилі: використовуємо напряму твої CSS змінні через var()
    const variantStyles = {
        primary: "bg-[var(--theme-btn-primary-bg)] bg-gradient-to-b from-[var(--theme-btn-primary-grad-top)] to-[var(--theme-btn-primary-bg)] border border-[var(--theme-btn-primary-border)] text-[var(--theme-btn-primary-text)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)] hover:bg-[var(--theme-btn-primary-hover-bg)] hover:from-[var(--theme-btn-primary-hover-grad-top)] hover:to-[var(--theme-btn-primary-hover-bg)]",

        secondary: "bg-[var(--theme-btn-secondary-bg)] bg-gradient-to-b from-[var(--theme-btn-secondary-grad-top)] to-[var(--theme-btn-secondary-bg)] border border-[var(--theme-btn-secondary-border)] text-[var(--theme-btn-secondary-text)] hover:bg-[var(--theme-btn-secondary-hover-bg)] hover:from-[var(--theme-btn-secondary-hover-grad-top)] hover:to-[var(--theme-btn-secondary-hover-bg)]",

        danger: "bg-[var(--theme-btn-danger-bg)] bg-gradient-to-b from-[var(--theme-btn-danger-grad-top)] to-[var(--theme-btn-danger-bg)] border border-[var(--theme-btn-danger-border)] text-[var(--theme-btn-danger-text)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)] hover:bg-[var(--theme-btn-danger-hover-bg)] hover:from-[var(--theme-btn-danger-hover-grad-top)] hover:to-[var(--theme-btn-danger-hover-bg)]",

        warning: "bg-[var(--theme-btn-warning-bg)] bg-gradient-to-b from-[var(--theme-btn-warning-grad-top)] to-[var(--theme-btn-warning-bg)] border border-[var(--theme-btn-warning-border)] text-[var(--theme-btn-warning-text)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)] hover:bg-[var(--theme-btn-warning-hover-bg)] hover:from-[var(--theme-btn-warning-hover-grad-top)] hover:to-[var(--theme-btn-warning-hover-bg)]",

        approve: "bg-[var(--theme-btn-success-bg)] bg-gradient-to-b from-[var(--theme-btn-success-grad-top)] to-[var(--theme-btn-success-bg)] border border-[var(--theme-btn-success-border)] text-[var(--theme-btn-success-text)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)] hover:bg-[var(--theme-btn-success-hover-bg)] hover:from-[var(--theme-btn-success-hover-grad-top)] hover:to-[var(--theme-btn-success-hover-bg)]",

        reject: "bg-[var(--theme-btn-reject-bg)] bg-gradient-to-b from-[var(--theme-btn-reject-grad-top)] to-[var(--theme-btn-reject-bg)] border border-[var(--theme-btn-reject-border)] text-[var(--theme-btn-reject-text)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)] hover:bg-[var(--theme-btn-reject-hover-bg)] hover:from-[var(--theme-btn-reject-hover-grad-top)] hover:to-[var(--theme-btn-reject-hover-bg)]",
    };

    // Стилі для вимкненого стану (перебивають інші кольори за допомогою `!`)
    // Також скидаємо hover та active ефекти
    const disabledStyles = "disabled:!bg-[var(--theme-btn-disabled-bg)] disabled:!bg-none disabled:!border-[var(--theme-btn-disabled-border)] disabled:!text-[var(--theme-btn-disabled-text)] disabled:![text-shadow:none] disabled:!shadow-none disabled:cursor-not-allowed disabled:active:py-[5px]";

    // У тебе в коді іноді `success` іноді `approve`. Якщо варіант "success", використовуємо "approve" з об'єкта.
    const mappedVariant = variant === "success" ? "approve" : variant;
    const currentVariantStyle = variantStyles[mappedVariant] || variantStyles.primary;

    const combinedClasses = [
        baseStyles,
        currentVariantStyle,
        disabled ? disabledStyles : "",
        className
    ].filter(Boolean).join(" ");

    return (
        <button
            className={combinedClasses}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;