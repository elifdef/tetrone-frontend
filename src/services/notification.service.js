import fetchClient from "../api/client";

class NotificationService {
    async read(id) {
        return await fetchClient(`/notifications/${id}/read`, { method: 'POST' });;
    }

    async readAll() {
        return await fetchClient('/notifications', { method: 'POST' });
    }

    async deleteAll() {
        return await fetchClient('/notifications', { method: 'DELETE' });
    }
}

export default new NotificationService();