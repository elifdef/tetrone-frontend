export default function Banner({ personalization }) {
    const bannerStyle = personalization?.banner_image
        ? { background: `url(${personalization.banner_image}) center/cover no-repeat` }
        : { background: personalization?.banner_color || 'var(--theme-btn-primary-bg)' };

    return (
        <div
            className="w-full h-[200px] bg-cover bg-center relative"
            style={bannerStyle}
        />
    );
}