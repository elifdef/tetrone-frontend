import type { PRIVACY } from '@/config';
import type { TipTapDoc, VerificationBadge, UserPersonalization } from '@/types/user';

export type SettingsTabId =
    | 'profile'
    | 'personalization'
    | 'security'
    | 'notifications'
    | 'sessions'
    | 'privacy';

export interface ProfileFormState {
    first_name: string;
    last_name: string;
    bio: TipTapDoc | string | null;
    birth_date: string;
    country: string;
    gender: number;
    avatarFile: File | null;
    removeAvatar: boolean;
}

export type ProfileFieldName = 'first_name' | 'last_name' | 'birth_date' | 'country' | 'gender' | 'bio';

export type ProfileFormErrors = Partial<Record<ProfileFieldName, string>>;
export type ProfileFormTouched = Partial<Record<ProfileFieldName, boolean>>;

export interface PersonalizationFormState {
    banner_color: string;
    username_color: string;
    banner_image: string | null;
    verification_badge_type: 'classic' | 'sticker';
    verification_sticker_id: number | null;
}

export interface PersonalizationUpdateResponse {
    code: string;
    personalization: UserPersonalization;
    verification_badge: VerificationBadge | null;
}

export type NotificationSettingType =
    | 'messages'
    | 'likes'
    | 'comments'
    | 'reposts'
    | 'wall_posts'
    | 'friend_requests'
    | 'space_posts';

export interface NotificationCategoryPreference {
    is_enabled: boolean;
    sound_id: number;
}

export type NotificationPreferencesMap = Record<NotificationSettingType, NotificationCategoryPreference>;

export interface NotificationSettingUpdateItem {
    type: NotificationSettingType;
    is_enabled: boolean;
    sound_id: number;
}

export interface SessionDeviceInfo {
    client_type: string;
    browser: string;
    browser_version: string;
    os: string;
    os_version: string;
    is_robot: boolean;
    raw_user_agent: string | null;
}

export interface UserSession {
    id: number;
    name: string;
    ip_address: string;
    location: string;
    device: SessionDeviceInfo;
    last_used_at: string | null;
    created_at: string;
    is_current: boolean;
    is_api_token?: boolean;
}

export type PrivacyContextType = (typeof PRIVACY.CONTEXTS)[number];
export type PrivacyLevelValue = (typeof PRIVACY.LEVELS)[keyof typeof PRIVACY.LEVELS];
export type PrivacySettingsMap = Record<PrivacyContextType, PrivacyLevelValue>;

export interface PrivacyExceptionTargetUser {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
    username_color?: string | null;
}

export interface PrivacyExceptionItem {
    id: number;
    user_id: number;
    target_user_id: number;
    context: PrivacyContextType;
    is_allowed: boolean;
    target_user?: PrivacyExceptionTargetUser;
}

export interface UserAliasItem {
    id: string | number;
    handle: string;
}

export type DeleteAccountPayload = {
    password: string;
    delete_own_posts: boolean;
    delete_traces: boolean;
    delete_chats: boolean;
};