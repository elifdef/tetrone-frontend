import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { AuthContext } from "../context/AuthContext";
import UserProfileCard from "../components/profile/UserProfileCard";
import UserWall from "../components/post/UserWall";
import { usePageTitle } from "../hooks/usePageTitle";

export default function ProfilePage({ profile }) {
    const { t } = useTranslation();
    const { user: authUser } = useContext(AuthContext);
    
    usePageTitle(profile?.username);

    if (!profile) return null;

    const isOwnProfile = authUser && authUser.username === profile.username;

    // якщо це МІЙ профіль і він НЕ готовий 
    if (isOwnProfile && !profile.is_setup_complete) {
        return <Navigate to="/setup-profile" replace />;
    }

    // якщо це ЧУЖИЙ профіль і він НЕ готовий 
    if (!profile.is_setup_complete) {
        return (
            <div className="not-setup-profile">
                <h2>{t('profile.not_setup')}</h2>
                <p>{t('profile.not_setup_desc', { name: profile.username })}</p>
            </div>
        );
    }

    return (
        <>
            <UserProfileCard currentUser={profile} />

            {(profile.friendship_status !== "blocked_by_target" && !profile.is_banned && !profile.is_deleted) && (
                <UserWall profileUser={profile} isOwnProfile={isOwnProfile} />
            )}
        </>
    );
}