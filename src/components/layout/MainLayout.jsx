import { useContext } from "react";
import { Outlet } from "react-router";
import { AuthContext } from "../../context/AuthContext";
import { AudioProvider } from "../../context/AudioContext";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import Footer from "./Footer";
import EmailVerificationBanner from "./EmailVerificationBanner";

export default function MainLayout() {
    const { user } = useContext(AuthContext);

    return (
        <AudioProvider>
            {user && <EmailVerificationBanner user={user} />}

            <div className="flex justify-center w-full max-w-[1536px] mx-auto gap-5 px-[15px] box-border min-h-screen max-md:flex-col max-md:p-0">
                <LeftSidebar />
                <main className="w-[50%] shrink min-w-0 pt-[15px] max-md:w-full max-md:pt-[60px] max-md:px-[10px] max-md:pb-[10px] max-md:box-border">
                    <Outlet />
                </main>
                <RightSidebar />
            </div>
            <Footer />
        </AudioProvider>
    );
}