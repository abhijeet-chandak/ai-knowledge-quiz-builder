import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quiz_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('quiz_token')) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        localStorage.removeItem('quiz_token');
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export async function generateQuiz(topic) {
  const { data } = await api.post('/api/quizzes', { topic });
  if (!data.success) throw new Error(data.error?.message || 'Generate failed');
  return data.data;
}

export async function submitQuiz(quizId, answers) {
  const { data } = await api.post(`/api/quizzes/${quizId}/submissions`, {
    answers,
  });
  if (!data.success) throw new Error(data.error?.message || 'Submit failed');
  return data.data;
}

export async function getQuizHistory() {
  const { data } = await api.get('/api/quizzes');
  if (!data.success) throw new Error(data.error?.message || 'History failed');
  return data.data.quizzes;
}

export async function getQuizDetail(quizId) {
  const { data } = await api.get(`/api/quizzes/${quizId}`);
  if (!data.success) throw new Error(data.error?.message || 'Load failed');
  return data.data;
}

export async function getQuizForTaking(quizId) {
  const { data } = await api.get(`/api/quizzes/${quizId}/questions`);
  if (!data.success) throw new Error(data.error?.message || 'Load failed');
  return data.data;
}

export function getErrorMessage(err) {
  if (err.response?.data?.error?.message) return err.response.data.error.message;
  if (err.message) return err.message;
  return 'Something went wrong';
}

export default api;
