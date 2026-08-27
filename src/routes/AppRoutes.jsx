import { useContext } from "react";
import { Routes, Route } from "react-router";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import SettingsPage from '../pages/SettingsPage';
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import SetupProfilePage from "../pages/SetupProfilePage";
import IndexPage from "../pages/IndexPage";
import FeedPage from "../pages/FeedPage.jsx";
import FriendsPage from "../pages/FriendsPage";
import PostPage from "../pages/PostPage";
import NotFoundPage from "../pages/NotFoundPage";
import SupportPage from "../pages/SupportPage";
import SupportPanelPage from "../pages/SupportPanelPage";
import RulesPage from "../pages/RulesPage";
import ModerationPage from "../pages/ModerationPage";
import { GuestGuard, AuthGuard, SetupGuard, RoleGuard } from "./Guards";
import AdminUserInfo from "../components/admin/AdminUserInfo";
import { userRole } from "../config";
import NotificationsPage from "../pages/NotificationsPage";
import ActivityPage from "../pages/ActivityPage";
import MessagesPage from "../pages/MessagesPage";
import StickerShopPage from '../pages/StickerShopPage';
import AdminPage from '../pages/AdminPage';
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import EntityResolverPage from "../pages/EntityResolverPage";
import SpacesPage from "../pages/SpacesPage";
import AboutPage from "../pages/AboutPage.jsx";
export default function AppRoutes() {
    const { user } = useContext(AuthContext);

    return (
        <Routes>
            {!user && <Route path="/" element={<IndexPage />} />}
            {/* тільки для гостей */}
            <Route element={<GuestGuard />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* якщо користувач не закінчив оформлення профілю вертаєм назад */}
            <Route element={<SetupGuard />}>
                <Route path="/setup-profile" element={<SetupProfilePage />} />
            </Route>

            <Route element={<MainLayout />}>

                <Route path="/post/:id" element={<PostPage />} />
                {/* правила */}
                <Route path="/rules" element={<RulesPage />} />
                {/* підтримка */}
                <Route path="/support" element={<SupportPage />} />
                {/* про проект */}
                <Route path="/about" element={<AboutPage />} />

                {/* маршрути для користувачів які ввійшли */}
                <Route element={<AuthGuard />}>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/friends" element={<FriendsPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/email-verify/:id/:hash" element={<FeedPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    <Route path="/stickers-shop" element={<StickerShopPage />} />
                    <Route path="/spaces" element={<SpacesPage />} />

                    <Route path="/support-panel" element={
                        <RoleGuard allowedRoles={[userRole.Support]}>
                            <SupportPanelPage />
                        </RoleGuard>
                    } />

                    <Route path="/moderation" element={
                        <RoleGuard allowedRoles={[userRole.Moderator]}>
                            <ModerationPage />
                        </RoleGuard>
                    } />

                    <Route path="/control-panel" element={
                        <RoleGuard allowedRoles={[userRole.Admin, userRole.Creator]}>
                            <AdminPage />
                        </RoleGuard>
                    } />

                    <Route path="/control-panel/users/:username" element={
                        <RoleGuard allowedRoles={[userRole.Admin, userRole.Creator]}>
                            <AdminUserInfo />
                        </RoleGuard>
                    } />
                </Route>

                <Route path="/:handle" element={<EntityResolverPage />} />

            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}