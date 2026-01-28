const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw error;
  }
  return response.json();
};

// Helper function to refresh token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken })
  });

  if (!response.ok) {
    // Refresh token is invalid, clear storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  return data.access;
};

// API request wrapper with auto token refresh
const apiRequest = async (url, options = {}) => {
  try {
    let response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: getAuthHeaders()
    });

    // If unauthorized, try refreshing token
    if (response.status === 401) {
      await refreshAccessToken();
      // Retry request with new token
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: getAuthHeaders()
      });
    }

    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// ============================================
// Authentication API
// ============================================

export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(response);

    // Store tokens and user data
    if (data.access && data.refresh) {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await handleResponse(response);

    // Store tokens and user data
    if (data.access && data.refresh) {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => apiRequest('/auth/me/'),

  changePassword: (passwordData) => apiRequest('/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify(passwordData)
  }),

  requestPasswordReset: (email) => fetch(`${API_BASE_URL}/auth/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  }).then(handleResponse),

  confirmPasswordReset: (resetData) => fetch(`${API_BASE_URL}/auth/password-reset-confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resetData)
  }).then(handleResponse)
};

// ============================================
// Patient API
// ============================================

export const patientAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/patients/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/patients/${id}/`),
  getStats: () => apiRequest('/patient-stats/'),
  getArchived: (params = {}) => {
    const queryString = new URLSearchParams({ ...params, archived: 'true' }).toString();
    return apiRequest(`/patients/?${queryString}`);
  },
  getAdmittable: () => apiRequest('/patients/admittable/'),
  getAppointable: () => apiRequest('/patients/appointable/'),
  create: (data) => apiRequest('/patients/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/patients/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  partialUpdate: (id, data) => apiRequest(`/patients/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/patients/${id}/`, {
    method: 'DELETE'
  }),
  archive: (id) => apiRequest(`/patients/${id}/archive/`, {
    method: 'POST'
  }),
  restore: (id) => apiRequest(`/patients/${id}/restore/`, {
    method: 'POST'
  })
};

// ============================================
// Doctor API
// ============================================

export const doctorAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/doctors/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/doctors/${id}/`),
  getArchived: (params = {}) => {
    const queryString = new URLSearchParams({ ...params, archived: 'true' }).toString();
    return apiRequest(`/doctors/?${queryString}`);
  },
  create: (data) => apiRequest('/doctors/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/doctors/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/doctors/${id}/`, {
    method: 'DELETE'
  }),
  archive: (id) => apiRequest(`/doctors/${id}/archive/`, {
    method: 'POST'
  }),
  restore: (id) => apiRequest(`/doctors/${id}/restore/`, {
    method: 'POST'
  })
};

// ============================================
// Nurse API
// ============================================

export const nurseAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/nurses/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/nurses/${id}/`),
  getArchived: (params = {}) => {
    const queryString = new URLSearchParams({ ...params, archived: 'true' }).toString();
    return apiRequest(`/nurses/?${queryString}`);
  },
  create: (data) => apiRequest('/nurses/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/nurses/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/nurses/${id}/`, {
    method: 'DELETE'
  }),
  archive: (id) => apiRequest(`/nurses/${id}/archive/`, {
    method: 'POST'
  }),
  restore: (id) => apiRequest(`/nurses/${id}/restore/`, {
    method: 'POST'
  })
};

// ============================================
// Appointment API
// ============================================

export const appointmentAPI = {
  getAll: () => apiRequest('/appointments/'),
  getActive: () => apiRequest('/appointments/active/'),
  getCompleted: () => apiRequest('/appointments/completed/'),
  getById: (id) => apiRequest(`/appointments/${id}/`),
  create: (data) => apiRequest('/appointments/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/appointments/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/appointments/${id}/`, {
    method: 'DELETE'
  }),
  markCompleted: (id) => apiRequest(`/appointments/${id}/mark-completed/`, {
    method: 'POST'
  }),
  markNoShow: (id) => apiRequest(`/appointments/${id}/mark-no-show/`, {
    method: 'POST'
  })
};

// ============================================
// Admission API
// ============================================

export const admissionAPI = {
  getAll: () => apiRequest('/admissions/'),
  getById: (id) => apiRequest(`/admissions/${id}/`),
  create: (data) => apiRequest('/admissions/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/admissions/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  partialUpdate: (id, data) => apiRequest(`/admissions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/admissions/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Payment API
// ============================================

export const paymentAPI = {
  getAll: () => apiRequest('/payments/'),
  getById: (id) => apiRequest(`/payments/${id}/`),
  create: (data) => apiRequest('/payments/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createWithCalculation: (data) => apiRequest('/create-payment/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/payments/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Prediction API
// ============================================

export const predictionAPI = {
  getAll: () => apiRequest('/predictions/'),
  getById: (id) => apiRequest(`/predictions/${id}/`),
  predict: (patientId, userId) => apiRequest(`/predict/${patientId}/`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId })
  })
};

// ============================================
// Procedure API
// ============================================

export const procedureAPI = {
  getAll: () => apiRequest('/procedures/'),
  getById: (id) => apiRequest(`/procedures/${id}/`),
  create: (data) => apiRequest('/procedures/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/procedures/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/procedures/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Room API
// ============================================

export const roomAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/rooms/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/rooms/${id}/`),
  create: (data) => apiRequest('/rooms/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/rooms/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/rooms/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Dashboard API
// ============================================

export const dashboardAPI = {
  getStats: () => apiRequest('/dashboard-stats/')
};

// ============================================
// User API
// ============================================

export const userAPI = {
  getAll: () => apiRequest('/users/'),
  getById: (id) => apiRequest(`/users/${id}/`),
  create: (data) => apiRequest('/users/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/users/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/users/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Schedule API
// ============================================

export const scheduleAPI = {
  // Get all schedules with optional filters
  // Filters: ?user=1, ?date=2025-10-13, ?start_date=2025-10-01&end_date=2025-10-31, ?is_available=true
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/schedules/${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => apiRequest(`/schedules/${id}/`),

  // Get schedules for a specific user (doctor or nurse)
  getByUser: (userId) => apiRequest(`/schedules/?user=${userId}`),

  // Get schedules for a specific date
  getByDate: (date) => apiRequest(`/schedules/?date=${date}`),

  // Get schedules for a date range
  getByDateRange: (startDate, endDate) => apiRequest(`/schedules/?start_date=${startDate}&end_date=${endDate}`),

  // Get available schedules only
  getAvailable: () => apiRequest('/schedules/?is_available=true'),

  // Get weekly schedule
  getWeekly: (startDate) => apiRequest(`/schedules/weekly/${startDate ? `?start_date=${startDate}` : ''}`),

  // Bulk create schedules
  bulkCreate: (schedules) => apiRequest('/schedules/bulk-create/', {
    method: 'POST',
    body: JSON.stringify({ schedules })
  }),

  // Get night shift rotation suggestions
  getNightRotation: (startDate, weeks = 4) => apiRequest(`/schedules/night-rotation/?start_date=${startDate}&weeks=${weeks}`),

  // Get my personal schedule
  getMySchedule: (startDate, endDate) => apiRequest(`/schedules/my-schedule/?start_date=${startDate}&end_date=${endDate}`),

  create: (data) => apiRequest('/schedules/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => apiRequest(`/schedules/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  partialUpdate: (id, data) => apiRequest(`/schedules/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  delete: (id) => apiRequest(`/schedules/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Shift Swap API
// ============================================

export const shiftSwapAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/shift-swaps/${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => apiRequest(`/shift-swaps/${id}/`),

  create: (data) => apiRequest('/shift-swaps/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => apiRequest(`/shift-swaps/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  approve: (id, adminNotes = '') => apiRequest(`/shift-swaps/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify({ admin_notes: adminNotes })
  }),

  reject: (id, adminNotes = '') => apiRequest(`/shift-swaps/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ admin_notes: adminNotes })
  }),

  delete: (id) => apiRequest(`/shift-swaps/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Unavailability Request API
// ============================================

export const unavailabilityAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/unavailability-requests/${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => apiRequest(`/unavailability-requests/${id}/`),

  create: (data) => apiRequest('/unavailability-requests/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => apiRequest(`/unavailability-requests/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  approve: (id, adminNotes = '') => apiRequest(`/unavailability-requests/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify({ admin_notes: adminNotes })
  }),

  reject: (id, adminNotes = '') => apiRequest(`/unavailability-requests/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ admin_notes: adminNotes })
  }),

  delete: (id) => apiRequest(`/unavailability-requests/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Medicine API
// ============================================

export const medicineAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/medicines/${queryString ? `?${queryString}` : ''}`);
  },
  getActive: () => apiRequest('/medicines/?is_active=true'),
  getLowStock: () => apiRequest('/medicines/?low_stock=true'),
  getById: (id) => apiRequest(`/medicines/${id}/`),
  create: (data) => apiRequest('/medicines/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/medicines/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/medicines/${id}/`, {
    method: 'DELETE'
  })
};

// ============================================
// Prescription API
// ============================================

export const prescriptionAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/prescriptions/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/prescriptions/${id}/`),
  getPending: () => apiRequest('/prescriptions/pending/'),
  getDispensed: () => apiRequest('/prescriptions/?status=dispensed'),
  getPatientHistory: (patientId) => apiRequest(`/patients/${patientId}/prescriptions/`),
  create: (data) => apiRequest('/prescriptions/create/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  dispenseItem: (itemId, pharmacyStaffId) => apiRequest(`/prescriptions/items/${itemId}/dispense/`, {
    method: 'POST',
    body: JSON.stringify({ pharmacy_staff_id: pharmacyStaffId })
  })
};

// ============================================
// Pharmacy Staff API
// ============================================

export const pharmacyStaffAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/pharmacy-staff/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/pharmacy-staff/${id}/`),
  getArchived: (params = {}) => {
    const queryString = new URLSearchParams({ ...params, archived: 'true' }).toString();
    return apiRequest(`/pharmacy-staff/?${queryString}`);
  },
  create: (data) => apiRequest('/pharmacy-staff/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/pharmacy-staff/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/pharmacy-staff/${id}/`, {
    method: 'DELETE'
  }),
  archive: (id) => apiRequest(`/pharmacy-staff/${id}/archive/`, {
    method: 'POST'
  }),
  restore: (id) => apiRequest(`/pharmacy-staff/${id}/restore/`, {
    method: 'POST'
  })
};
