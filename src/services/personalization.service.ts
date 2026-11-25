import fetchClient from '../api/client';
import type { ApiRequestHandle } from '@/types/api';
import type { PersonalizationUpdateResponse } from '@/features/settings/types/settings';

const personalizationService = {
    updateSettings: (
        payload: FormData | Record<string, unknown>
    ): ApiRequestHandle<PersonalizationUpdateResponse> =>
        fetchClient<PersonalizationUpdateResponse>('/settings/personalization', {
            method: 'POST',
            body: payload,
        }),
};

export default personalizationService;