import VideoPlayer from "../../ui/VideoPlayer";

export default function YouTubePreviews({ youtubeLinks, removedPreviews, onToggle }) {
    if (!youtubeLinks || youtubeLinks.length === 0) return null;

    return (
        <div className="flex flex-col gap-[10px] mt-[10px]">
            {youtubeLinks.map(yt => {
                const isAttached = !removedPreviews.includes(yt.videoId);

                return (
                    <div key={`preview-${yt.id}`} className="relative w-full">
                        <label className="absolute top-[8px] right-[8px] z-10 p-[6px] flex items-center justify-center cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.3)] bg-bg-box">
                            <input
                                type="checkbox"
                                checked={isAttached}
                                onChange={() => onToggle(yt.videoId)}
                                className="cursor-pointer w-[18px] h-[18px] m-0 accent-theme-link"
                            />
                        </label>

                        <div className={`transition-opacity duration-200 border border-border bg-black overflow-hidden ${isAttached ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'}`}>
                            <VideoPlayer src={yt.videoId} provider="youtube" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}