import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import GlobalAudioPlayer from "./GlobalAudioPlayer";
import { useIsMobile } from "../../hooks/useIsMobile";

const RightSidebar = () => {
    const { user } = useContext(AuthContext);
    const isMobile = useIsMobile();

    return (
        <aside className="tetrone-sidebar-right">
            {!isMobile && <GlobalAudioPlayer />}
        </aside>
    );
};

export default RightSidebar;