import fetchClient from '../api/client';

const ReportService = {
    getReasons: () => fetchClient('/reports/reasons'),

    submitReport: ({ type, id, reason, details }) => fetchClient('/reports', {
        method: 'POST',
        body: {
            type: type,
            id: String(id),
            reason: reason,
            details: details
        }
    })
};

export default ReportService;