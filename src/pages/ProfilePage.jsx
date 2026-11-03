import { useNavigate } from "react-router";
import { useTranslation } from 'react-i18next';
import { useContext } from "react";
import { Navigate } from "react-router";
import { AuthContext } from "../context/AuthContext";
import UserProfileCard from "../components/profile/UserProfileCard";
import UserWall from "../components/post/UserWall";
import { usePageTitle } from "../hooks/usePageTitle";
import chatService from "../services/chat.service";
import { notifyError } from "../components/common/Notify";

export default function ProfilePage({ profile }) {
    const { t } = useTranslation();
    const { user: authUser } = useContext(AuthContext);
    const navigate = useNavigate();

    usePageTitle(profile?.username);

    if (!profile) return null;

    const isOwnProfile = authUser && authUser.username === profile.username;

    if (isOwnProfile && !profile.is_setup_complete) {
        return <Navigate to="/setup-profile" replace />;
    }

    const handleOpenChat = (targetUsername) => {
        chatService.initChat(targetUsername)
            .onSuccess((res) => {
                if (res?.slug) {
                    navigate(`/messages?id=${res.slug}`);
                }
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    };

    if (!profile.is_setup_complete) {
        return (
            <div className="p-[20px] text-center bg-bg-box border border-border mt-[15px]">
                <h2 className="m-0 mb-[10px] text-[13px] font-bold text-theme-error">
                    {t('profile.not_setup')}
                </h2>
                <p className="m-0 text-[11px] text-text-muted italic">
                    {t('profile.not_setup_desc', { name: profile.username })}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[15px]">
            <UserProfileCard currentUser={profile} onOpenChat={handleOpenChat} />

            {(profile.friendship_status !== "blocked_by_target" && !profile.is_banned && !profile.is_deleted) && (
                <UserWall profileUser={profile} isOwnProfile={isOwnProfile} />
            )}
        </div>
    );
}