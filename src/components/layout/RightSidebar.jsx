import { memo } from "react";
import GlobalAudioPlayer from "./GlobalAudioPlayer";
import { useIsMobile } from "../../hooks/useIsMobile";

const RightSidebar = () => {
    const isMobile = useIsMobile();

    return (
        <aside className="w-[10%] min-w-[200px] shrink-0 sticky top-[15px] h-max flex flex-col max-md:hidden">
            {!isMobile && <GlobalAudioPlayer />}
        </aside>
    );
};

export default memo(RightSidebar);