import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

// Dashboard services
export const dashboardService = {
  getStatistics: () => api.get('/dashboard/statistics'),
  getWeeklyChart: (weeks) => api.get('/dashboard/weekly-chart', { params: { weeks } }),
  getMonthlySummary: (month, year) => api.get('/dashboard/monthly-summary', { params: { month, year } }),
  getDepartmentAttendance: () => api.get('/dashboard/department-attendance'),
  getOvertimeSummary: (startDate, endDate) => api.get('/dashboard/overtime-summary', { params: { startDate, endDate } }),
  getLateArrivals: (days) => api.get('/dashboard/late-arrivals', { params: { days } }),
};

// Employee services
export const employeeService = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getAttendanceSummary: (id, params) => api.get(`/employees/${id}/attendance-summary`, { params }),
};

// Attendance services
export const attendanceService = {
  getAll: (params) => api.get('/attendance', { params }),
  getToday: () => api.get('/attendance/today'),
  getSummary: (params) => api.get('/attendance/summary', { params }),
  manualAttendance: (data) => api.post('/attendance/manual', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  processLogs: () => api.post('/attendance/process-logs'),
};

// Device services
export const deviceService = {
  getAll: (params) => api.get('/devices', { params }),
  getById: (id) => api.get(`/devices/${id}`),
  getStatistics: () => api.get('/devices/stats/summary'),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  testConnection: (id) => api.post(`/devices/${id}/test-connection`),
  restart: (id) => api.post(`/devices/${id}/restart`),
};

// Department services
export const departmentService = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Shift services
export const shiftService = {
  getAll: () => api.get('/shifts'),
  getById: (id) => api.get(`/shifts/${id}`),
  create: (data) => api.post('/shifts', data),
  update: (id, data) => api.put(`/shifts/${id}`, data),
  delete: (id) => api.delete(`/shifts/${id}`),
};

// Leave services
export const leaveService = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  create: (data) => api.post('/leaves', data),
  approve: (id) => api.post(`/leaves/${id}/approve`),
  reject: (id, data) => api.post(`/leaves/${id}/reject`, data),
  getLeaveTypes: () => api.get('/leaves/types/all'),
  createLeaveType: (data) => api.post('/leaves/types', data),
  getLeaveBalance: (employeeId) => api.get(`/leaves/balance/${employeeId}`),
};

// Report services
export const reportService = {
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
  getEmployeeSummaryReport: (params) => api.get('/reports/employee-summary', { params }),
  getLateReport: (params) => api.get('/reports/late', { params }),
  getOvertimeReport: (params) => api.get('/reports/overtime', { params }),
  getLeaveReport: (params) => api.get('/reports/leave', { params }),
  getDeviceReport: (params) => api.get('/reports/device', { params }),
};

// User services
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getPermissions: (id) => api.get(`/users/${id}/permissions`),
  updatePermissions: (id, data) => api.put(`/users/${id}/permissions`, data),
};

export default api;
