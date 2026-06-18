import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: API
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config
})

// Response Interceptor: 401 Error
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            try {
                const storedRefreshToken = localStorage.getItem("refreshToken")

                if (!storedRefreshToken) {
                    throw new Error("empty refresh token")
                }

                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken: storedRefreshToken,
                })

                const { accessToken, refreshToken } = response.data;

                // store new Token in LocalStorage 
                localStorage.setItem('token', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login'; // Force redirect to login
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error)
    }
)