import { User, UserRole, Appointment, AppointmentStatus, AiRecord, Doctor } from '../types';

const API_URL = 'http://localhost:5000/api';

/**
 * Service to interact with the Real Node.js Backend.
 * To use this instead of mockBackend:
 * 1. Ensure backend is running (node server.js)
 * 2. Update AuthContext to import from here.
 */
export const api = {
  // --- Auth ---
  login: async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    return data.user;
  },

  register: async (userData: Partial<User>): Promise<User> => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error('Registration failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  // --- Data ---
  getDoctors: async (): Promise<Doctor[]> => {
    const res = await fetch(`${API_URL}/doctors`);
    return res.json();
  },

  getAppointments: async (): Promise<Appointment[]> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  createAppointment: async (appt: any): Promise<Appointment> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(appt)
    });
    return res.json();
  },

  updateAppointmentStatus: async (id: string, status: string): Promise<void> => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status })
    });
  },

  // --- AI ---
  analyzeSymptoms: async (symptoms: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/ai/predict`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ symptoms })
    });
    return res.json();
  }
};