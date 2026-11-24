import fetchClient from '../api/client';

export interface AdminFilterParams {
    status?: string;
    type?: string;
    date?: string;
    reason?: string;
    search?: string;
}

const AdminService = {
    getUsers: (search = '', page = 1) =>
        fetchClient(`/admin/users?search=${encodeURIComponent(search)}&page=${page}`),

    getUser: (username: string) => fetchClient(`/admin/users/${encodeURIComponent(username)}`),

    getUserStats: (search = '') =>
        fetchClient(`/admin/users/stats${search ? `?search=${encodeURIComponent(search)}` : ''}`),

    toggleMute: (username: string, reason?: string) =>
        fetchClient(`/admin/users/${encodeURIComponent(username)}/mute`, {
            method: 'POST',
            body: { reason },
        }),

    toggleBan: (username: string, reason?: string) =>
        fetchClient(`/admin/users/${encodeURIComponent(username)}/ban`, {
            method: 'POST',
            body: { reason },
        }),

    togglePostCheck: (id: number | string) =>
        fetchClient(`/admin/posts/${id}/toggle-check`, { method: 'POST' }),

    getDashboardStats: () => fetchClient('/admin/dashboard'),

    getReports: (filters: AdminFilterParams = {}) => {
        const queryParams = new URLSearchParams();

        if (filters.status && filters.status !== 'all') queryParams.append('filter[status]', filters.status);
        if (filters.type && filters.type !== 'all') queryParams.append('filter[type]', filters.type);
        if (filters.date && filters.date !== 'all') queryParams.append('filter[date]', filters.date);
        if (filters.reason && filters.reason !== 'all') queryParams.append('filter[reason]', filters.reason);
        if (filters.search && filters.search.trim() !== '') queryParams.append('filter[search]', filters.search.trim());

        const queryString = queryParams.toString();
        return fetchClient(queryString ? `/admin/reports?${queryString}` : '/admin/reports');
    },

    handleReport: (reportId: number | string, actionType: string, adminResponse = '') =>
        fetchClient(`/admin/reports/${reportId}/${actionType}`, {
            method: 'POST',
            body: { admin_response: adminResponse },
        }),

    getAppeals: (filters: AdminFilterParams = {}) => {
        const queryParams = new URLSearchParams();

        if (filters.status && filters.status !== 'all') queryParams.append('filter[status]', filters.status);
        if (filters.date && filters.date !== 'all') queryParams.append('filter[date]', filters.date);
        if (filters.search && filters.search.trim() !== '') queryParams.append('filter[search]', filters.search.trim());

        const queryString = queryParams.toString();
        return fetchClient(queryString ? `/admin/appeals?${queryString}` : '/admin/appeals');
    },

    handleAppeal: (appealId: number | string, actionType: string, adminResponse?: string) =>
        fetchClient(`/admin/appeals/${appealId}/${actionType}`, {
            method: 'POST',
            body: { admin_response: adminResponse },
        }),

    getUserComments: (username: string, page = 1) =>
        fetchClient(`/admin/users/${encodeURIComponent(username)}/comments?page=${page}`),

    getUserLikes: (username: string, page = 1) =>
        fetchClient(`/admin/users/${encodeURIComponent(username)}/likes?page=${page}`),

    getUserSessions: (username: string) =>
        fetchClient(`/admin/users/${encodeURIComponent(username)}/sessions`),

    getTicket: (id: number | string) => fetchClient(`/admin/tickets/${id}`),

    replyToTicket: (id: number | string, message: string, isInternal?: boolean) =>
        fetchClient(`/admin/tickets/${id}/reply`, {
            method: 'POST',
            body: { message, is_internal: isInternal },
        }),

    assignTicket: (id: number | string) =>
        fetchClient(`/admin/tickets/${id}/assign`, {
            method: 'POST',
        }),

    closeTicket: (id: number | string, reason = '') =>
        fetchClient(`/admin/tickets/${id}/close`, {
            method: 'POST',
            body: { reason },
        }),

    getUserPosts: (username = '', page = 1, isChecked = 'all', dateFrom = '', dateTo = '') => {
        const params = new URLSearchParams();
        if (username) params.append('username', username);
        params.append('page', String(page));
        if (isChecked !== 'all') params.append('is_checked', isChecked);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);

        return fetchClient(`/admin/posts?${params.toString()}`);
    },

    getPostStats: (username = '', dateFrom = '', dateTo = '') => {
        const params = new URLSearchParams();
        if (username) params.append('username', username);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);

        return fetchClient(`/admin/posts/stats?${params.toString()}`);
    },

    getTickets: (filters: AdminFilterParams = {}) => {
        const queryParams = new URLSearchParams();
        if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
        if (filters.search && filters.search.trim() !== '') queryParams.append('search', filters.search.trim());
        const queryString = queryParams.toString();
        return fetchClient(queryString ? `/admin/tickets?${queryString}` : '/admin/tickets');
    },

    changeRole: (identifier: string | number, role: number | string, reason?: string) =>
        fetchClient(`/admin/users/${encodeURIComponent(String(identifier))}/change-role`, {
            method: 'POST',
            body: { role, reason },
        }),

    getStaffLogs: (page = 1) => fetchClient(`/admin/staff-logs?page=${page}`),
    getAdminLogs: (adminId: number | string, page = 1) => fetchClient(`/admin/staff-logs/${adminId}?page=${page}`),
    getStaffLogsSummary: () => fetchClient('/admin/staff-logs/summary'),
    getStaffLogsCharts: () => fetchClient('/admin/staff-logs/charts'),
};

export default AdminService;