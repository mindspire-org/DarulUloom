import axios from 'axios';

// API base URL - will work for both localhost and LAN
const isElectron = Boolean((window as any)?.electron?.isElectron);
const isFileProtocol = window.location.protocol === 'file:';

const electronApiBase = (window as any)?.electron?.apiBaseUrl as string | undefined;

const API_URL =
    (isElectron || isFileProtocol) && electronApiBase
        ? electronApiBase
        : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api');

export const toAbsoluteAssetUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;

    // If backend returns "/uploads/..." (or similar), derive origin from API base.
    const base = API_URL;
    const origin = base.replace(/\/api\/?$/, "");
    return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
};

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        
        if (error.response?.status === 401 && !isLoginRequest) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = isElectron || isFileProtocol ? '#/login' : '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),

    getMe: () => api.get('/auth/me'),
};

// Students API
export const studentsAPI = {
    create: (data: FormData) =>
        api.post('/students', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    bulkCreate: (data: any[]) => api.post('/students/import-excel', data),

    getMy: () => api.get('/students/my'),

    updateMy: (id: string, data: any) => {
        if (data instanceof FormData) {
            return api.put(`/students/my/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.put(`/students/my/${id}`, data);
    },

    deleteMy: (id: string) => api.delete(`/students/my/${id}`),

    regenerateMyToken: (id: string) => api.post(`/students/my/${id}/regenerate-token`),

    getAll: (params?: { status?: string; class?: string; search?: string }) =>
        api.get('/students', { params }),

    getPending: () => api.get('/students/pending'),

    getCounter2: (params?: { status?: string; search?: string }) =>
        api.get('/students/counter2', { params }),

    updateCounter2: (id: string, data: any) => api.put(`/students/counter2/${id}`, data),

    deleteAll: () => api.delete('/students/all'),

    deleteCounter2: (id: string) => api.delete(`/students/counter2/${id}`),

    getByToken: (tokenNumber: string) =>
        api.get(`/students/token/${tokenNumber}`),

    getById: (id: string) => api.get(`/students/${id}`),

    verify: (id: string, data: any) =>
        api.put(`/students/${id}/verify`, data),

    update: (id: string, data: any) => api.put(`/students/${id}`, data),

    delete: (id: string) => api.delete(`/students/${id}`),

    // Counter 2 Verification page (admin)
    getForVerification: (params?: { search?: string; category?: string; status?: string }) =>
        api.get('/students/verification', { params }),

    updateVerification: (id: string, data: FormData) =>
        api.put(`/students/${id}/verification`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    searchByName: (studentName: string, fatherName: string) =>
        api.get('/students/search-by-name', { params: { studentName, fatherName } }),
};

// Tokens API (Counter 1)
export const tokensAPI = {
    create: (data: FormData) =>
        api.post('/tokens', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    getMy: () => api.get('/tokens/my'),

    updateMy: (id: string, data: any) => {
        if (data instanceof FormData) {
            return api.put(`/tokens/my/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.put(`/tokens/my/${id}`, data);
    },

    deleteMy: (id: string) => api.delete(`/tokens/my/${id}`),

    regenerateMyToken: (id: string) => api.post(`/tokens/my/${id}/regenerate-token`),

    // Counter 2
    getPending: () => api.get('/tokens/pending'),

    getByToken: (tokenNumber: string) => api.get(`/tokens/token/${tokenNumber}`),

    getByCnic: (cnic: string) => api.get(`/tokens/cnic/${cnic}`),

    verify: (id: string, data: any) => api.put(`/tokens/${id}/verify`, data),

    saveFormData: (id: string, formData: any) => api.put(`/tokens/${id}/form-data`, { formData }),
};

// Grades API
export const gradesAPI = {
    getAll: (type?: string) =>
        api.get('/grades', { params: { type } }),

    create: (data: any) => api.post('/grades', data),

    update: (id: string, data: any) =>
        api.put(`/grades/${id}`, data),

    delete: (id: string) => api.delete(`/grades/${id}`),
};

// Users API
export const usersAPI = {
    getAll: () => api.get('/users'),

    create: (data: any) => api.post('/users', data),

    update: (id: string, data: any) =>
        api.put(`/users/${id}`, data),

    delete: (id: string) => api.delete(`/users/${id}`),

    updateMe: (data: { name?: string; username?: string }) => api.put('/users/me', data),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        api.put('/users/me/password', data),
};

// Stats API
export const statsAPI = {
    getDashboard: () => api.get('/stats'),
};

// Reports API
export const reportsAPI = {
    list: () => api.get('/reports'),

    downloadCsv: (type: string) =>
        api.get(`/reports/${type}/download`, {
            responseType: 'blob',
        }),
};

// Settings API
export const settingsAPI = {
    get: () => api.get('/settings'),

    update: (data: any) => api.put('/settings', data),
};

export default api;
