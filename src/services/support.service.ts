import fetchClient from '../api/client';

const supportService = {
    getCategories: () => fetchClient('/support/categories'),
    getTickets: (page = 1) => fetchClient(`/support/tickets?page=${page}`),
    getTicket: (id: number | string) => fetchClient(`/support/tickets/${id}`),
    replyToTicket: (id: number | string, message: string) =>
        fetchClient(`/support/tickets/${id}/reply`, {
            method: 'POST',
            body: { message },
        }),
    createTicket: (formData: FormData | Record<string, unknown>) =>
        fetchClient('/support/tickets', {
            method: 'POST',
            body: formData,
        }),
};

export default supportService;