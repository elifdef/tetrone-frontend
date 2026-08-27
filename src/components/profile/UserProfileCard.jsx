import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";
import { useUserProfileLogic } from "./hooks/useUserProfileLogic";
import { useDateFormatter } from "../../hooks/useDateFormatter";
import PostService from "../../services/post.service";
import { notifyError } from "../common/Notify";
import ClassicProfileCard from "./classic/ClassicProfileCard";
import ModernProfileCard from "./modern/ModernProfileCard"; // Поки що заглушка
import ReportModal from "../modals/ReportModal";
import PhotoModal from "../modals/PhotoModal";

export default function UserProfileCard({ currentUser, isPreview = false, forceTheme = null }) {
    const { t } = useTranslation();
    const { user: authUser } = useContext(AuthContext);
    const formatDate = useDateFormatter();

    // 1. Уся бізнес-логіка з хука
    const {
        status, loading, sameUser,
        isBanned, isBlockedByMe, isBlockedByTarget, isDeleted,
        displayAvatar, displayBio, displayBirth, displayCountry, displayGender,
        handleFriendshipAction, handleBlockAction
    } = useUserProfileLogic(currentUser, isPreview);

    // 2. Стейт для модалок
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [avatarPosts, setAvatarPosts] = useState([]);
    const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);

    if (!currentUser) return null;

    // 3. Підготовка даних (щоб тупі компоненти не думали)
    const isStaff = currentUser.role >= 1; // Support і вище
    const isPrivateProfile = currentUser.is_private && !sameUser;
    const effectiveBio = isPrivateProfile ? t('privacy.account_is_private') : displayBio;

    // Статус онлайн
    let statusText = t('common.offline');
    if (currentUser.is_online) statusText = t('common.online');
    else if (currentUser.last_seen) {
        const dateStr = formatDate(currentUser.last_seen);
        statusText = currentUser.gender === 2
            ? t('profile.status.last_seen_f', { time: dateStr })
            : t('profile.status.last_seen_m', { time: dateStr });
    }

    // Завантаження аватарок
    const handleAvatarClick = async () => {
        const hasCustomAvatar = currentUser.avatar && !currentUser.avatar.includes('defaultAvatar');
        if (isPreview || isBlockedByTarget || isBanned || isPrivateProfile || !hasCustomAvatar || isAvatarLoading) return;

        setIsAvatarLoading(true);
        const res = await PostService.getUserAvatars(currentUser.username);
        if (res && res.avatars?.length > 0) {
            setAvatarPosts(res.avatars);
            setCurrentAvatarIndex(0);
            setIsPhotoModalOpen(true);
        } else if (res?.message) {
            notifyError(res.message);
        }
        setIsAvatarLoading(false);
    };

    const nextAvatar = () => setCurrentAvatarIndex(prev => (prev + 1) % avatarPosts.length);
    const prevAvatar = () => setCurrentAvatarIndex(prev => (prev - 1 + avatarPosts.length) % avatarPosts.length);

    // Збираємо всі пропси в один об'єкт для чистоти
    const profileProps = {
        user: currentUser,
        authUser,
        isPreview,
        sameUser,
        isStaff,
        isBanned,
        isDeleted,
        isPrivateProfile,
        isBlockedByMe,
        isBlockedByTarget,
        displayAvatar,
        effectiveBio,
        displayBirth,
        displayCountry,
        displayGender,
        status,
        statusText,
        loading,
        onFriendAction: handleFriendshipAction,
        onBlockAction: handleBlockAction,
        onReportAction: () => setIsReportModalOpen(true),
        onAvatarClick: handleAvatarClick,
        isAvatarLoading,
        joinedDate: currentUser.created_at ? formatDate(currentUser.created_at, { withTime: true, forceYear: true }) : ''
    };

    const localTheme = localStorage.getItem('app_profile_theme') || 'classic';
    const activeTheme = forceTheme || localTheme;

    return (
        <>
            {activeTheme === 'classic' ? (
                <ClassicProfileCard {...profileProps} />
            ) : (
                <ModernProfileCard {...profileProps} />
            )}

            {/* Модалки живуть тільки в розумному контейнері */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="user"
                targetId={currentUser.id}
            />

            {avatarPosts.length > 0 && (
                <PhotoModal
                    isOpen={isPhotoModalOpen}
                    post={avatarPosts[currentAvatarIndex]}
                    onClose={() => setIsPhotoModalOpen(false)}
                    onNext={avatarPosts.length > 1 ? nextAvatar : null}
                    onPrev={avatarPosts.length > 1 ? prevAvatar : null}
                    listCurrent={currentAvatarIndex + 1}
                    listTotal={avatarPosts.length}
                />
            )}
        </>
    );
}