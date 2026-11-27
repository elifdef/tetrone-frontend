import { useTranslation } from 'react-i18next';

export const PATTERN_GRID_SIZE = 4;
export const PATTERN_TOTAL_CELLS = PATTERN_GRID_SIZE * PATTERN_GRID_SIZE;
export const MIN_PATTERN_LENGTH = 4;

export interface PatternGridProps {
    selectedIndices: number[];
    onChange: (nextIndices: number[]) => void;
    disabled?: boolean;
    hasError?: boolean;
    stealthMode?: boolean;
    onStealthModeChange?: (stealth: boolean) => void;
}

export default function PatternGrid({
    selectedIndices,
    onChange,
    disabled = false,
    hasError = false,
    stealthMode = false,
    onStealthModeChange,
}: PatternGridProps) {
    const { t } = useTranslation();

    const handleCellToggle = (index: number) => {
        if (disabled) return;
        if (selectedIndices.includes(index)) return;
        onChange([...selectedIndices, index]);
    };

    const handleClear = () => {
        if (disabled || selectedIndices.length === 0) return;
        onChange([]);
    };

    return (
        <div className="flex flex-col gap-[10px] select-none">
            <div className="flex items-center justify-between gap-[8px] text-[10px] text-text-muted">
                <span>{t('auth.pattern_select_hint')}</span>

                {onStealthModeChange && (
                    <label className="inline-flex items-center gap-[5px] cursor-pointer text-text-muted hover:text-text-main shrink-0">
                        <input
                            type="checkbox"
                            checked={stealthMode}
                            onChange={(e) => onStealthModeChange(e.target.checked)}
                            disabled={disabled}
                            className="m-0 w-[12px] h-[12px] accent-theme-link cursor-pointer"
                        />
                        <span>{t('auth.pattern_stealth_mode')}</span>
                    </label>
                )}
            </div>

            <div
                role="group"
                aria-label={t('auth.pattern_grid_aria')}
                className={`grid grid-cols-4 gap-[8px] p-[10px] bg-bg-page border ${
                    hasError ? 'border-theme-error' : 'border-border'
                }`}
            >
                {Array.from({ length: PATTERN_TOTAL_CELLS }, (_, index) => {
                    const orderPosition = selectedIndices.indexOf(index);
                    const isSelected = orderPosition !== -1;
                    const showSelectionVisual = isSelected && !stealthMode;

                    return (
                        <button
                            key={index}
                            type="button"
                            disabled={disabled}
                            aria-pressed={isSelected}
                            aria-label={t('auth.pattern_cell_aria', { number: index + 1 })}
                            onClick={() => handleCellToggle(index)}
                            className={`aspect-square w-full border transition-colors duration-100 cursor-pointer relative flex items-center justify-center p-0 outline-none focus:ring-1 focus:ring-theme-link disabled:opacity-50 disabled:cursor-not-allowed ${
                                showSelectionVisual
                                    ? hasError
                                        ? 'bg-theme-error/15 border-theme-error text-theme-error font-bold'
                                        : 'bg-theme-link/15 border-theme-link text-theme-link font-bold'
                                    : 'bg-bg-box text-text-muted border-input-border hover:border-theme-link hover:bg-bg-hover'
                            }`}
                        >
                            {showSelectionVisual ? (
                                <span className="text-[12px] leading-none">
                                    {orderPosition + 1}
                                </span>
                            ) : (
                                <span className="w-[5px] h-[5px] bg-current opacity-30 block" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-end">
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={disabled || selectedIndices.length === 0}
                    className="inline-block px-[12px] py-[5px] font-tahoma text-[11px] font-bold text-center no-underline cursor-pointer box-border outline-none transition-colors duration-100 select-none bg-[var(--theme-btn-secondary-bg)] bg-gradient-to-b from-[var(--theme-btn-secondary-grad-top)] to-[var(--theme-btn-secondary-bg)] border border-[var(--theme-btn-secondary-border)] text-[var(--theme-btn-secondary-text)] hover:bg-[var(--theme-btn-secondary-hover-bg)] hover:from-[var(--theme-btn-secondary-hover-grad-top)] hover:to-[var(--theme-btn-secondary-hover-bg)] disabled:!bg-[var(--theme-btn-disabled-bg)] disabled:!bg-none disabled:!border-[var(--theme-btn-disabled-border)] disabled:!text-[var(--theme-btn-disabled-text)] disabled:cursor-not-allowed"
                >
                    {t('action.clear')}
                </button>
            </div>
        </div>
    );
}