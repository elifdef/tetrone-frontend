import React, { useState, useEffect } from "react";
import Footer from "../components/layout/Footer";
import { usePageTitle } from "../hooks/usePageTitle";
import StatsService from "../services/public.service";
import LandingAuthWidget from "../components/landing/LandingAuthWidget";
import RecentUsersSection from "../components/landing/RecentUsersSection";
import StatsSection from "../components/landing/StatsSection";
import WelcomeSection from "../components/landing/WelcomeSection";
import SiteNewsSection from "../components/landing/SiteNewsSection"; // <--- Імпортуємо

export default function IndexPage() {
    usePageTitle();

    const [stats, setStats] = useState({ users: 0, posts: 0, online: 0 });
    const [recentUsers, setRecentUsers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await StatsService.getLanding();
            setStats(data.stats)
            setRecentUsers(data.users);
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen text-[11px] bg-bg-page text-text-main font-tahoma">
            <div className="w-full max-w-[960px] mx-auto my-[20px] flex flex-col md:flex-row gap-[15px] flex-1 px-[10px] md:px-0 box-border">

                {/* Ліва колонка (~65%) */}
                <div className="w-full md:w-[65%] flex flex-col gap-[15px]">
                    <WelcomeSection />

                    {/* ТУТ НАШІ НОВИНИ */}
                    <SiteNewsSection />
                </div>

                {/* Права колонка (~35%) */}
                <div className="w-full md:w-[35%] flex flex-col gap-[15px]">
                    <LandingAuthWidget />
                    <StatsSection {...stats} />
                    <RecentUsersSection users={recentUsers} />
                </div>

            </div>
            <Footer />
        </div>
    );
}