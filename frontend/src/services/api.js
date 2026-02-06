import axios from 'axios';
import config from '../config';

const api = axios.create({
    baseURL: config.API_BASE_URL
});

// Removed interceptors as authentication is disabled
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export const authService = {
    login: (data) => Promise.resolve({ data: { token: 'guest', username: 'Guest' } }),
    register: (data) => Promise.resolve({ data: "User registered" })
};

export const formService = {
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/forms/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getHistory: () => api.get('/forms/history'),
    getResults: (id) => api.get(`/forms/${id}/results`),
    delete: (id) => api.delete(`/forms/${id}`),
    getImageUrl: (id) => `${config.API_BASE_URL}/forms/${id}/image`
};
