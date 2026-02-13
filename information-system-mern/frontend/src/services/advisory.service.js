/**
 * Advisory Service
 */
import api from './api';

const advisoryService = {
    createAdvisory: async (data) => {
        const response = await api.post('/advisories', data);
        return response.data;
    },

    getAdvisories: async () => {
        const response = await api.get('/advisories');
        return response.data;
    },

    getAllAdvisories: async () => {
        const response = await api.get('/advisories/all');
        return response.data;
    },

    resolveAdvisory: async (id) => {
        const response = await api.put(`/advisories/${id}/resolve`);
        return response.data;
    },

    setOngoing: async (id) => {
        const response = await api.put(`/advisories/${id}/ongoing`);
        return response.data;
    },
};

export default advisoryService;
