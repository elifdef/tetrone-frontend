import React, { useState, useEffect } from "react";
import Footer from "../components/layout/Footer";
import { usePageTitle } from "../hooks/usePageTitle";
import StatsService from "../services/public.service";
import LandingAuthWidget from "../components/landing/LandingAuthWidget";
import RecentUsersSection from "../components/landing/RecentUsersSection";
import StatsSection from "../components/landing/StatsSection";
import WelcomeSection from "../components/landing/WelcomeSection";

export default function IndexPage()
{
    usePageTitle();

    const [stats, setStats] = useState({users: 0, posts: 0, online: 0});
    const [recentUsers, setRecentUsers] = useState([]);

    useEffect(() =>
    {
        const fetchData = async() =>
        {
            const data = await StatsService.getLanding();

            setStats(data.stats)
            setRecentUsers(data.users);
        };
        fetchData();
    }, []);

    return (<div className="tetrone-landing-root">
        <div className="tetrone-landing-container">
            <div className="tetrone-landing-left-col">
                <WelcomeSection/>
            </div>

            <div className="tetrone-landing-right-col">
                <LandingAuthWidget/>
                <StatsSection {...stats} />
                <RecentUsersSection users={recentUsers}/>
            </div>
        </div>
        <Footer/>
    </div>);
}