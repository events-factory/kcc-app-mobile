// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.kcc.eventsfactory.rw',
  ENDPOINTS: {
    // Authentication
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',

    // Events
    EVENTS: '/events',
    EVENT_BY_ID: (id: number) => `/events/${id}`,

    // Attendees
    ATTENDEES: '/attendees',
    ATTENDEE_BY_ID: (id: number) => `/attendees/${id}`,
    ATTENDEES_BY_EVENT: (eventId: number) => `/attendees?eventId=${eventId}`,
    ATTENDEES_EVENT_STATS: (eventId: number) =>
      `/attendees/event/${eventId}/stats`,
    ATTENDEES_RECENT_CHECKINS: (eventId: number) =>
      `/attendees/event/${eventId}/recent-check-ins`,
    ATTENDEES_CHECKIN: '/attendees/check-in',

    // Check-ins
    CHECKINS: '/check-ins',
    CHECKIN_BY_QR: '/check-ins/qr',

    // Entrances
    ENTRANCES: '/entrances',
    ENTRANCE_STATS: (eventId: number) => `/entrances/event/${eventId}/stats`,

    // Statistics
    STATS: '/stats',
    EVENT_STATS: (eventId: number) => `/attendees/event/${eventId}/stats`,
  },
};

// Helper function to build full URL
export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to create headers with auth token
export const createAuthHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Generic API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const url = buildUrl(endpoint);
  const headers = createAuthHeaders(token);

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Specific API functions
export const authApi = {
  login: async (email: string, password: string) => {
    return apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name: string, email: string, password: string) => {
    return apiRequest(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },
};

export const eventsApi = {
  getAll: async (token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.EVENTS,
      {
        method: 'GET',
      },
      token
    );
  },

  getById: async (id: number, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.EVENT_BY_ID(id),
      {
        method: 'GET',
      },
      token
    );
  },

  create: async (eventData: any, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.EVENTS,
      {
        method: 'POST',
        body: JSON.stringify(eventData),
      },
      token
    );
  },

  update: async (id: number, eventData: any, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.EVENT_BY_ID(id),
      {
        method: 'PUT',
        body: JSON.stringify(eventData),
      },
      token
    );
  },

  delete: async (id: number, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.EVENT_BY_ID(id),
      {
        method: 'DELETE',
      },
      token
    );
  },
};

export const attendeesApi = {
  getAll: async (token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.ATTENDEES,
      {
        method: 'GET',
      },
      token
    );
  },

  getByEvent: async (eventId: number, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.ATTENDEES_BY_EVENT(eventId),
      {
        method: 'GET',
      },
      token
    );
  },

  create: async (attendeeData: any, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.ATTENDEES,
      {
        method: 'POST',
        body: JSON.stringify(attendeeData),
      },
      token
    );
  },

  checkIn: async (
    badgeId: string,
    entrance: string,
    eventId: number,
    token: string
  ) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.ATTENDEES_CHECKIN,
      {
        method: 'POST',
        body: JSON.stringify({
          badgeId,
          entrance,
          eventId,
        }),
      },
      token
    );
  },
};

export const checkInsApi = {
  getAll: async (token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.CHECKINS,
      {
        method: 'GET',
      },
      token
    );
  },

  checkInByQR: async (qrCode: string, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.CHECKIN_BY_QR,
      {
        method: 'POST',
        body: JSON.stringify({ qrCode }),
      },
      token
    );
  },
};

export const entrancesApi = {
  getAll: async (token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.ENTRANCES,
      {
        method: 'GET',
      },
      token
    );
  },

  getByEvent: async (eventId: number, token: string) => {
    const allEntrances = await apiRequest(
      API_CONFIG.ENDPOINTS.ENTRANCES,
      {
        method: 'GET',
      },
      token
    );
    // Filter entrances by eventId (as shown in the screenshot)
    return allEntrances.filter((entrance: any) => entrance.eventId === eventId);
  },

  create: async (entranceData: any, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.ENTRANCES,
      {
        method: 'POST',
        body: JSON.stringify(entranceData),
      },
      token
    );
  },
};

export const statsApi = {
  getOverall: async (token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.STATS,
      {
        method: 'GET',
      },
      token
    );
  },

  getEventStats: async (eventId: number, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.ATTENDEES_EVENT_STATS(eventId),
      {
        method: 'GET',
      },
      token
    );
  },

  getEntranceStats: async (eventId: number, token: string) => {
    return apiRequest(
      API_CONFIG.ENDPOINTS.ENTRANCE_STATS(eventId),
      {
        method: 'GET',
      },
      token
    );
  },

  getRecentCheckIns: async (
    eventId: number,
    token: string,
    limit: number = 10
  ) => {
    return apiRequest(
      `${API_CONFIG.ENDPOINTS.ATTENDEES_RECENT_CHECKINS(
        eventId
      )}?limit=${limit}`,
      {
        method: 'GET',
      },
      token
    );
  },
};
