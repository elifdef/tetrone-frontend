import fetchClient from '../api/client';
import type { ApiRequestHandle } from '@/types/api';
import type {
    PrivacyContextType,
    PrivacyExceptionItem,
    PrivacyLevelValue,
    PrivacySettingsMap,
} from '@/features/settings/types/settings';

export interface PrivacyResponse {
    code: string;
    privacy: {
        settings: Partial<PrivacySettingsMap> | [];
        exceptions: PrivacyExceptionItem[];
    };
}

const PrivacyService = {
    getSettings: (): ApiRequestHandle<PrivacyResponse> =>
        fetchClient<PrivacyResponse>('/settings/privacy'),

    updateSetting: (
        context: PrivacyContextType,
        level: PrivacyLevelValue
    ): ApiRequestHandle<{ code: string; settings: PrivacySettingsMap }> =>
        fetchClient<{ code: string; settings: PrivacySettingsMap }>('/settings/privacy', {
            method: 'PATCH',
            body: { context, level },
        }),

    updateSettings: (
        settings: Partial<PrivacySettingsMap>
    ): ApiRequestHandle<{ code: string; settings: PrivacySettingsMap }> =>
        fetchClient<{ code: string; settings: PrivacySettingsMap }>('/settings/privacy', {
            method: 'PATCH',
            body: { settings },
        }),

    setException: (
        targetUsername: string,
        context: PrivacyContextType,
        isAllowed: boolean
    ): ApiRequestHandle<{ code: string; exception: PrivacyExceptionItem }> =>
        fetchClient<{ code: string; exception: PrivacyExceptionItem }>('/settings/privacy/exceptions', {
            method: 'POST',
            body: {
                target_username: targetUsername,
                context,
                is_allowed: isAllowed,
            },
        }),

    deleteException: (
        targetUsername: string,
        context: PrivacyContextType
    ): ApiRequestHandle<{ code: string }> =>
        fetchClient<{ code: string }>(
            `/settings/privacy/exceptions/${encodeURIComponent(targetUsername)}/${encodeURIComponent(context)}`,
            {
                method: 'DELETE',
            }
        ),
};

export default PrivacyService;