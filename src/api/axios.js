import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://support-backend-ghne.onrender.com/api',
  timeout: 10000
})

// Request interceptor - add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('waToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401 and auto-logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAuthRoute = ['/auth/employee/login', '/auth/token-login', '/auth/customer/login', '/auth/me'].some((route) => requestUrl.includes(route))
      if (!isAuthRoute) {
        localStorage.removeItem('waToken')
        localStorage.removeItem('waUser')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api