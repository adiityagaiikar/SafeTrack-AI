import { auth } from './services/firebase';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/api`;

async function parseApiError(response, fallbackMessage) {
    try {
        const data = await response.json();
        return data?.detail || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

const NETWORK_ERROR = 'Cannot reach the backend. Make sure FastAPI is running on port 8000.';

// Helper to get auth headers
const getHeaders = (token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const api = {
    detectAccident: async (videoUrl, token) => {
        let response;
        try {
            response = await fetch(`${BASE_URL}/video/detect`, {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify({ video_url: videoUrl }),
            });
        } catch {
            throw new Error(NETWORK_ERROR);
        }

        if (!response.ok) {
            const detail = await parseApiError(response, 'Detection failed');
            throw new Error(detail);
        }
        return response.json();
    },

    getIncidents: async (token) => {
        let response;
        try {
            response = await fetch(`${BASE_URL}/report/incidents`, {
                headers: getHeaders(token),
            });
        } catch {
            throw new Error(NETWORK_ERROR);
        }
        if (!response.ok) throw new Error('Failed to fetch incidents');
        return response.json();
    },

    dispatchSOS: async (payload) => {
        let response;

        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be logged in to dispatch SOS');
        }

        const token = await currentUser.getIdToken(true);

        try {
            response = await fetch(`${BASE_URL}/sos/dispatch`, {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify(payload),
            });
        } catch {
            throw new Error(NETWORK_ERROR);
        }

        if (!response.ok) {
            const detail = await parseApiError(response, 'Failed to dispatch SOS');
            throw new Error(detail);
        }
        return response.json();
    },

    getEmergencyContacts: async (token) => {
        let response;
        try {
            response = await fetch(`${BASE_URL}/user/contacts`, {
                headers: getHeaders(token),
            });
        } catch {
            throw new Error(NETWORK_ERROR);
        }

        if (!response.ok) {
            const detail = await parseApiError(response, 'Failed to fetch contacts');
            throw new Error(detail);
        }
        return response.json();
    },

    saveEmergencyContacts: async (contacts, token) => {
        let response;
        try {
            response = await fetch(`${BASE_URL}/user/contacts`, {
                method: 'PUT',
                headers: getHeaders(token),
                body: JSON.stringify({ contacts }),
            });
        } catch {
            throw new Error(NETWORK_ERROR);
        }

        if (!response.ok) {
            const detail = await parseApiError(response, 'Failed to save contacts');
            throw new Error(detail);
        }
        return response.json();
    },

    // We will add more endpoints as needed
};
