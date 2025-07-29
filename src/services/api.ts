import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  verifyOTP: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  login: (credentials: any) => api.post('/auth/login', credentials),
  resendOTP: (email: string) => api.post('/auth/resend-otp', { email }),
};

export const alumniAPI = {
  requestApproval: (alumniData: any) => api.post('/alumni/request-approval', alumniData),
  getPendingRequests: (professorId: string) => api.get(`/alumni/pending-requests/${professorId}`),
  approveRequest: (requestId: string) => api.put(`/alumni/approve/${requestId}`),
  rejectRequest: (requestId: string) => api.put(`/alumni/reject/${requestId}`),
};

export const assessmentAPI = {
  create: (assessmentData: any) => api.post('/assessments', assessmentData),
  getById: (assessmentId: string) => api.get(`/assessments/${assessmentId}`),
  getByStudent: (studentId: string) => api.get(`/assessments/student/${studentId}`),
  getByProfessor: (professorId: string) => api.get(`/assessments/professor/${professorId}`),
  submit: (assessmentId: string, submissionData: any) => 
    api.post(`/assessments/${assessmentId}/submit`, submissionData),
  getResults: (assessmentId: string) => api.get(`/assessments/${assessmentId}/results`),
  getResultsWithStudents: (assessmentId: string) => api.get(`/assessments/${assessmentId}/results-with-students`),
  getStudentResults: (studentId: string) => api.get(`/assessments/results/student/${studentId}`),
  getStatus: (assessmentId: string) => api.get(`/assessments/${assessmentId}/status`),
  // Add method to check if student has already submitted
  checkSubmission: (assessmentId: string, studentId: string) => 
    api.get(`/assessments/${assessmentId}/submission/${studentId}`),
};

export const chatAPI = {
  sendMessage: (messageData: any) => api.post('/chat/send', messageData),
  getMessages: (userId1: string, userId2: string) => 
    api.get(`/chat/messages/${userId1}/${userId2}`),
  findUser: (query: string) => api.get(`/users/search?q=${query}`),
};

export const aiAPI = {
  generateRoadmap: (data: any) => api.post('/ai/roadmap', data),
  generateAssessment: (data: any) => api.post('/ai/assessment', data),
  explainAnswer: (question: string, correctAnswer: string) => 
    api.post('/ai/explain', { question, correctAnswer }),
  evaluateAnswers: (assessmentData: any) => api.post('/ai/evaluate', assessmentData),
};

export default api;