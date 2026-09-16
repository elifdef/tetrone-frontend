import React, { useState, useEffect } from "react";
import Footer from "../components/layout/Footer";
import { usePageTitle } from "../hooks/usePageTitle";
import StatsService from "../services/public.service";
import LandingAuthWidget from "../components/landing/LandingAuthWidget";
import RecentUsersSection from "../components/landing/RecentUsersSection";
import StatsSection from "../components/landing/StatsSection";
import WelcomeHeader from "../components/landing/WelcomeHeader";
import FeaturesSection from "../components/landing/FeaturesSection";
import MobileAuthBlock from "../components/landing/MobileAuthBlock";

export default function IndexPage() {
    usePageTitle();

    const [stats, setStats] = useState({ users: 0, posts: 0, online: 0 });
    const [recentUsers, setRecentUsers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await StatsService.getLanding();
            setStats(data.stats);
            setRecentUsers(data.users || []);
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen text-[11px] bg-bg-page text-text-main font-tahoma">
            <div className="w-full max-w-[960px] mx-auto md:my-[20px] px-[10px] md:px-0 box-border flex-1 flex flex-col">
                {/* мобільна версія */}
                <div className="flex flex-col gap-[8px] md:hidden flex-1 pb-0 mb-0">                    <WelcomeHeader isMobile={true} />
                    <StatsSection {...stats} isMobile={true} />
                    <RecentUsersSection users={recentUsers} isMobile={true} />
                    <MobileAuthBlock />
                    <FeaturesSection isMobile={true} />
                </div>

                {/* десктоп версія */}
                <div className="hidden md:flex flex-row gap-[15px] w-full">
                    <div className="w-[65%] flex flex-col gap-[15px]">
                        <WelcomeHeader isMobile={false} />
                        <FeaturesSection isMobile={false} />
                    </div>
                    <div className="w-[35%] flex flex-col gap-[15px]">
                        <LandingAuthWidget />
                        <StatsSection {...stats} isMobile={false} />
                        <RecentUsersSection users={recentUsers} isMobile={false} />
                    </div>
                </div>

            </div>
            <Footer />
        </div>
    );
}