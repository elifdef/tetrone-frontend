import { memo, useState, useEffect } from "react";
import GlobalAudioPlayer from "./GlobalAudioPlayer";

const RightSidebar = () => {
    const [isCompact, setIsCompact] = useState(() => window.innerWidth < 1024);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)");
        const onChange = (e) => setIsCompact(e.matches);
        setIsCompact(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return (
        <aside className="w-[280px] shrink-0 sticky top-[15px] h-max flex flex-col gap-[15px] max-lg:hidden">
            {!isCompact && <GlobalAudioPlayer />}
        </aside>
    );
};

export default memo(RightSidebar);