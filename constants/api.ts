export const BASE_URL = 'https://teamly-production.up.railway.app';

export const endpoints = {
  // Auth
  register: `${BASE_URL}/api/auth/register`,
  authenticate: `${BASE_URL}/api/auth/login`,
  signout: `${BASE_URL}/api/auth/signout`,
  deleteUser: (id: number) => `${BASE_URL}/api/auth/delete/${id}`,
  forgotPassword: `${BASE_URL}/api/auth/forgot-password`,
  resetPassword: `${BASE_URL}/api/auth/reset-password`,
    
  // Users
  profilePicture: `${BASE_URL}/api/users/profile-picture`,
  
  // Teams
  teams: `${BASE_URL}/api/teams`,
  team: (id: number) => `${BASE_URL}/api/teams/${id}`,
  teamMembers: (id: number) => `${BASE_URL}/api/teams/${id}/members`,
  teamJoin: (id: number) => `${BASE_URL}/api/teams/${id}/join`,

  // Features
  announcements: `${BASE_URL}/api/announcements`,
  announcement: (id: number) => `${BASE_URL}/api/announcements/${id}`,
  
  requests: `${BASE_URL}/api/requests`,
  requestStatus: (id: number) => `${BASE_URL}/api/requests/${id}/status`,

  events: `${BASE_URL}/api/events`,
  eventTasks: (eventId: number) => `${BASE_URL}/api/events/${eventId}/tasks`,
  taskStatus: (taskId: number) => `${BASE_URL}/api/events/tasks/${taskId}`,
};

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}
