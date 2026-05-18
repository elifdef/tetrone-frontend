import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import GlobalAudioPlayer from "./GlobalAudioPlayer";

const RightSidebar = () => {
    const { user } = useContext(AuthContext);
    
    return (
        <aside className="tetrone-sidebar-right">
            <GlobalAudioPlayer />
        </aside>
    );
};

export default RightSidebar;