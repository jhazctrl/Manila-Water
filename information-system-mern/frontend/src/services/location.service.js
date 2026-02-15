/**
 * Location Service
 */
import api from './api';

const locationService = {
    getBarangays: async () => {
        const response = await api.get('/locations/barangays');
        return response.data;
    },

    getStreets: async () => {
        const response = await api.get('/locations/streets');
        return response.data;
    },

    getStreetsByBarangay: async (brgyId) => {
        // ✅ FIXED: Use correct URL pattern that matches backend route
        const response = await api.get(`/locations/barangays/${brgyId}/streets`);
        return response.data;
    },
};

export default locationService;
