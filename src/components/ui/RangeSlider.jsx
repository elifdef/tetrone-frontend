import { forwardRef } from 'react';

const RangeSlider = forwardRef(({ className = "", ...props }, ref) => {
    return (
        <input
            type="range"
            ref={ref}
            className={`w-full h-1 bg-input-border rounded-[2px] outline-none appearance-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-theme-link [&::-webkit-slider-thumb]:rounded-full 
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-theme-link [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full 
            ${className}`}
            {...props}
        />
    );
});

RangeSlider.displayName = 'RangeSlider';
export default RangeSlider;