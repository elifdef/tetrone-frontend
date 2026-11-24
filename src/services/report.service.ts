import fetchClient from '../api/client';

export interface SubmitReportPayload {
    type: string;
    id: string | number;
    reason: string;
    details?: string;
}

const ReportService = {
    getReasons: () => fetchClient('/reports/reasons'),

    submitReport: ({ type, id, reason, details }: SubmitReportPayload) =>
        fetchClient('/reports', {
            method: 'POST',
            body: {
                type,
                id: String(id),
                reason,
                details,
            },
        }),
};

export default ReportService;