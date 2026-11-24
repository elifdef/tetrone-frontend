import { Routes, Route } from 'react-router';
import { useAuth } from '@/app/providers/auth-context';
import { GuestGuard, AuthGuard, SetupGuard, RoleGuard } from './Guards';
import MainLayout from '@/components/layout/MainLayout';
import { userRole } from '@/config';

import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import SetupProfilePage from '@/pages/SetupProfilePage';
import IndexPage from '@/pages/IndexPage';
import FeedPage from '@/pages/FeedPage';
import FriendsPage from '@/pages/FriendsPage';
import PostPage from '@/pages/PostPage';
import NotFoundPage from '@/pages/NotFoundPage';
import SupportPage from '@/pages/SupportPage';
import SupportPanelPage from '@/pages/SupportPanelPage';
import RulesPage from '@/pages/RulesPage';
import ModerationPage from '@/pages/ModerationPage';
import AdminUserInfo from '@/components/admin/AdminUserInfo';
import NotificationsPage from '@/pages/NotificationsPage';
import ActivityPage from '@/pages/ActivityPage';
import ChatPage from '@/pages/ChatPage';
import StickerShopPage from '@/pages/StickerShopPage';
import AdminPage from '@/pages/AdminPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import EntityResolverPage from '@/pages/EntityResolverPage';
import SpacesPage from '@/pages/SpacesPage';
import AboutPage from '@/pages/AboutPage';

export default function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            {!user && <Route path="/" element={<IndexPage />} />}

            <Route element={<GuestGuard />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            <Route element={<SetupGuard />}>
                <Route path="/setup-profile" element={<SetupProfilePage />} />
            </Route>

            <Route element={<MainLayout />}>
                <Route path="/post/:id" element={<PostPage />} />
                <Route path="/rules" element={<RulesPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/about" element={<AboutPage />} />

                <Route element={<AuthGuard />}>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/friends" element={<FriendsPage />} />
                    <Route path="/:username/friends" element={<FriendsPage />} />
                    <Route path="/:username/followers" element={<FriendsPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/email-verify/:id/:hash" element={<FeedPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    <Route path="/stickers-shop" element={<StickerShopPage />} />
                    <Route path="/spaces" element={<SpacesPage />} />

                    <Route
                        path="/support-panel"
                        element={
                            <RoleGuard allowedRoles={[userRole.Support]}>
                                <SupportPanelPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="/moderation"
                        element={
                            <RoleGuard allowedRoles={[userRole.Moderator]}>
                                <ModerationPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="/control-panel"
                        element={
                            <RoleGuard allowedRoles={[userRole.Admin, userRole.Owner]}>
                                <AdminPage />
                            </RoleGuard>
                        }
                    />

                    <Route
                        path="/control-panel/users/:username"
                        element={
                            <RoleGuard allowedRoles={[userRole.Admin, userRole.Owner]}>
                                <AdminUserInfo />
                            </RoleGuard>
                        }
                    />
                </Route>

                <Route path="/:handle" element={<EntityResolverPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
