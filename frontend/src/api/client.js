const API_BASE = '';

function getAuthHeader() {
  const token = localStorage.getItem('fitness_log_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = (data && data.error) || response.statusText || 'An error occurred';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // 1. POST /auth/register
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  // 2. POST /auth/login
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // 3. POST /workouts
  createWorkout: (body) => request('/workouts', { method: 'POST', body: JSON.stringify(body) }),

  // 4. GET /workouts
  getWorkouts: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/workouts${queryString}`, { method: 'GET' });
  },

  // 5. POST /goals
  createGoal: (body) => request('/goals', { method: 'POST', body: JSON.stringify(body) }),

  // 6. PATCH /goals/{id}
  patchGoal: (id, body) => request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // 7. GET /health-stats
  getHealthStats: () => request('/health-stats', { method: 'GET' }),

  // POST /health-stats (Log weight & update height)
  logHealthStats: (body) => request('/health-stats', { method: 'POST', body: JSON.stringify(body) }),

  // 8. GET /reports?period=weekly|monthly
  getReports: (period) => request(`/reports?period=${period}`, { method: 'GET' }),
};
