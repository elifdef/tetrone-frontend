import fetchClient from "../api/client";

const AdminService = {
    getUsers: async (search = '', page = 1) =>
    {
        return fetchClient(`/admin/users?search=${ search }&page=${ page }`);
    },

    async getUser(username)
    {
        return fetchClient(`/admin/users/${ username }`);
    },

    async toggleMute(username, reason)
    {
        return fetchClient(`/admin/users/${ username }/mute`, {
            method: 'POST',
            body: { reason }
        });
    },

    async toggleBan(username, reason)
    {
        return fetchClient(`/admin/users/${ username }/ban`, {
            method: 'POST',
            body: { reason }
        });
    },

    async getDashboardStats()
    {
        return fetchClient('/admin/dashboard');
    },

    async getReports(filters = {})
    {
        const queryParams = new URLSearchParams();

        if (filters.status && filters.status !== 'all')
        {
            queryParams.append('filter[status]', filters.status);
        }
        if (filters.type && filters.type !== 'all')
        {
            queryParams.append('filter[type]', filters.type);
        }
        if (filters.date && filters.date !== 'all')
        {
            queryParams.append('filter[date]', filters.date);
        }
        if (filters.reason && filters.reason !== 'all')
        {
            queryParams.append('filter[reason]', filters.reason);
        }
        if (filters.search && filters.search.trim() !== '')
        {
            queryParams.append('filter[search]', filters.search.trim());
        }

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/admin/reports?${ queryString }` : '/admin/reports';

        return fetchClient(endpoint);
    },

    async handleReport(reportId, actionType, adminResponse = '')
    {
        return fetchClient(`/admin/reports/${ reportId }/${ actionType }`, {
            method: 'POST',
            body: { admin_response: adminResponse }
        });
    },

    async getAppeals(filters = {})
    {
        const queryParams = new URLSearchParams();

        if (filters.status && filters.status !== 'all')
        {
            queryParams.append('filter[status]', filters.status);
        }
        if (filters.date && filters.date !== 'all')
        {
            queryParams.append('filter[date]', filters.date);
        }
        if (filters.search && filters.search.trim() !== '')
        {
            queryParams.append('filter[search]', filters.search.trim());
        }

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/admin/appeals?${ queryString }` : '/admin/appeals';

        return fetchClient(endpoint);
    },

    async handleAppeal(appealId, actionType, adminResponse)
    {
        return fetchClient(`/admin/appeals/${ appealId }/${ actionType }`, {
            method: 'POST',
            body: { admin_response: adminResponse }
        });
    },

    async getUserPosts(username = '', page = 1)
    {
        const query = username ? `?username=${ username }&page=${ page }` : `?page=${ page }`;
        return fetchClient(`/admin/posts${ query }`);
    },

    async getUserComments(username, page = 1)
    {
        return fetchClient(`/admin/users/${ username }/comments?page=${ page }`);
    },

    async getUserLikes(username, page = 1)
    {
        return fetchClient(`/admin/users/${ username }/likes?page=${ page }`);
    },

    async getUserSessions(username)
    {
        return fetchClient(`/admin/users/${ username }/sessions`);
    },

    async getTickets(status = '')
    {
        const query = status ? `?status=${ status }` : '';
        return fetchClient(`/admin/tickets${ query }`);
    },

    async getTicket(id)
    {
        return fetchClient(`/admin/tickets/${ id }`);
    },

    async replyToTicket(id, message, isInternal)
    {
        return fetchClient(`/admin/tickets/${ id }/reply`, {
            method: 'POST',
            body: { message, is_internal: isInternal }
        });
    },

    async assignTicket(id)
    {
        return fetchClient(`/admin/tickets/${ id }/assign`, {
            method: 'POST'
        });
    },

    async getDatabaseTables()
    {
        return fetchClient(`/admin/database/tables`);
    },

    async executeDbQuery(query)
    {
        return fetchClient(`/admin/database/query`, {
            method: 'POST',
            body: { query }
        });
    },

    async getStaffLogs(page = 1)
    {
        return fetchClient(`/admin/staff-logs?page=${ page }`);
    },

    async getStaffLogsSummary()
    {
        return fetchClient(`/admin/staff-logs/summary`);
    },

    async getStaffLogsCharts()
    {
        return fetchClient(`/admin/staff-logs/charts`);
    },

    closeTicket: async (id, reason = '') => {
        return fetchClient(`/admin/tickets/${id}/close`, {
            method: 'POST',
            body: { reason }
        });
    },
};

export default AdminService;