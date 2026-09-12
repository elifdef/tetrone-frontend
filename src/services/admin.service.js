import fetchClient from "../api/client";

const AdminService = {
    getUsers: (search = '', page = 1) => fetchClient(`/admin/users?search=${search}&page=${page}`),

    getUser: (username) => fetchClient(`/admin/users/${username}`),

    toggleMute: (username, reason) => fetchClient(`/admin/users/${username}/mute`, {
        method: 'POST',
        body: { reason }
    }),

    toggleBan: (username, reason) => fetchClient(`/admin/users/${username}/ban`, {
        method: 'POST',
        body: { reason }
    }),

    togglePostCheck: (id) => fetchClient(`/admin/posts/${id}/toggle-check`, { method: 'POST' }),

    getDashboardStats: () => fetchClient('/admin/dashboard'),

    getReports: (filters = {}) => {
        const queryParams = new URLSearchParams();

        if (filters.status && filters.status !== 'all') queryParams.append('filter[status]', filters.status);
        if (filters.type && filters.type !== 'all') queryParams.append('filter[type]', filters.type);
        if (filters.date && filters.date !== 'all') queryParams.append('filter[date]', filters.date);
        if (filters.reason && filters.reason !== 'all') queryParams.append('filter[reason]', filters.reason);
        if (filters.search && filters.search.trim() !== '') queryParams.append('filter[search]', filters.search.trim());

        const queryString = queryParams.toString();
        return fetchClient(queryString ? `/admin/reports?${queryString}` : '/admin/reports');
    },

    handleReport: (reportId, actionType, adminResponse = '') => fetchClient(`/admin/reports/${reportId}/${actionType}`, {
        method: 'POST',
        body: { admin_response: adminResponse }
    }),

    getAppeals: (filters = {}) => {
        const queryParams = new URLSearchParams();

        if (filters.status && filters.status !== 'all') queryParams.append('filter[status]', filters.status);
        if (filters.date && filters.date !== 'all') queryParams.append('filter[date]', filters.date);
        if (filters.search && filters.search.trim() !== '') queryParams.append('filter[search]', filters.search.trim());

        const queryString = queryParams.toString();
        return fetchClient(queryString ? `/admin/appeals?${queryString}` : '/admin/appeals');
    },

    handleAppeal: (appealId, actionType, adminResponse) => fetchClient(`/admin/appeals/${appealId}/${actionType}`, {
        method: 'POST',
        body: { admin_response: adminResponse }
    }),

    getUserComments: (username, page = 1) => fetchClient(`/admin/users/${username}/comments?page=${page}`),

    getUserLikes: (username, page = 1) => fetchClient(`/admin/users/${username}/likes?page=${page}`),

    getUserSessions: (username) => fetchClient(`/admin/users/${username}/sessions`),

    getTickets: (status = '') => fetchClient(`/admin/tickets${status ? `?status=${status}` : ''}`),

    getTicket: (id) => fetchClient(`/admin/tickets/${id}`),

    replyToTicket: (id, message, isInternal) => fetchClient(`/admin/tickets/${id}/reply`, {
        method: 'POST',
        body: { message, is_internal: isInternal }
    }),

    assignTicket: (id) => fetchClient(`/admin/tickets/${id}/assign`, {
        method: 'POST'
    }),

    getDatabaseTables: () => fetchClient(`/admin/database/tables`),

    executeDbQuery: (query) => fetchClient(`/admin/database/query`, {
        method: 'POST',
        body: { query }
    }),

    getStaffLogs: (page = 1) => fetchClient(`/admin/staff-logs?page=${page}`),

    getStaffLogsSummary: () => fetchClient(`/admin/staff-logs/summary`),

    getStaffLogsCharts: () => fetchClient(`/admin/staff-logs/charts`),

    closeTicket: (id, reason = '') => fetchClient(`/admin/tickets/${id}/close`, {
        method: 'POST',
        body: { reason }
    }),

    getUserPosts: (username = '', page = 1, isChecked = 'all', dateFrom = '', dateTo = '') => {
        const params = new URLSearchParams();
        if (username) params.append('username', username);
        params.append('page', page);
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
};

export default AdminService;