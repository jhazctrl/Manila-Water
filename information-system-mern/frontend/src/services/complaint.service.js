/**
 * Complaint Service
 */
import api from './api';

const complaintService = {
    submitComplaint: async (formData) => {
        // FormData for file upload — let browser set Content-Type with boundary
        const response = await api.post('/complaints', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getComplaints: async () => {
        const response = await api.get('/complaints');
        return response.data;
    },

    getMyComplaints: async () => {
        const response = await api.get('/complaints/my');
        return response.data;
    },

    updateStatus: async (complaintId, status) => {
        const response = await api.put('/complaints/status', {
            complaint_id: complaintId,
            status,
        });
        return response.data;
    },

    getOverview: async (range = 'week') => {
        const response = await api.get(`/complaints/overview?range=${range}`);
        return response.data;
    },

    getRecurring: async () => {
        const response = await api.get('/complaints/recurring');
        return response.data;
    },
};

export default complaintService;
