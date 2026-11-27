import fetchClient from '../api/client';

export interface AppealStatusResponse {
    code: string;
    has_pending_appeal: boolean;
}

export interface SubmitAppealResponse {
    code: string;
}

const AppealService = {
    checkStatus: () => fetchClient<AppealStatusResponse>('/appeals/status'),
    submitAppeal: (message: string) =>
        fetchClient<SubmitAppealResponse>('/appeals', {
            method: 'POST',
            body: { message },
        }),
};

export default AppealService;