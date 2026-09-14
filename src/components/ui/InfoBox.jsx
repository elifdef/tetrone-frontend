import { InfoIcon } from './Icons';

export default function InfoBox({ title, text, className = '' }) {
    return (
        <div className={`bg-bg-page border border-border p-[10px] flex gap-[10px] items-start shadow-[2px_2px_5px_rgba(0,0,0,0.2)] font-normal ${className}`}>
            <div className="text-theme-link mt-[2px] shrink-0">
                <InfoIcon width={20} height={20} />
            </div>
            <div className="flex flex-col min-w-0 text-left">
                {title && (
                    <strong className="text-[11px] text-theme-link font-bold block mb-[4px]">
                        {title}
                    </strong>
                )}
                {text && (
                    <p className="m-0 text-[11px] font-normal leading-[1.4] text-text-main tracking-normal">
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
}