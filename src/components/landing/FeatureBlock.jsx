export default function FeatureBlock({ title, description, image, imageAlt, color, isEven }) {
    return (
        <div
            className={`flex flex-col md:flex-row bg-bg-box border border-border p-[15px] items-center md:items-start text-center ${isEven ? 'md:flex-row-reverse md:text-right' : 'md:text-left'}`}
            style={{ borderLeft: `3px solid ${color}` }}
        >
            <div
                className={`shrink-0 bg-input-bg border border-border p-[5px] mb-[10px] md:mb-0 flex items-center justify-center ${isEven ? 'md:ml-[15px]' : 'md:mr-[15px]'}`}
                style={{ borderColor: color }}
            >
                <img
                    src={image}
                    alt={imageAlt}
                    className="max-w-full md:max-w-[300px] max-h-[250px] w-auto h-auto block"
                />
            </div>

            <div className="flex-1 pt-[5px]">
                <h2 className="text-[12px] font-bold m-0 mb-[8px]" style={{ color: color }}>
                    {title}
                </h2>
                <p className="m-0 leading-[1.5] text-text-main">
                    {description}
                </p>
            </div>
        </div>
    );
}