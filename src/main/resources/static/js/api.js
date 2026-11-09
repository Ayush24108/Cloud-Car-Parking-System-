/**
 * CloudPark 3D - API Client
 * Seamlessly interfaces with Spring Boot REST Backend
 */

const API_BASE = window.location.port === '8080' || window.location.port === '' 
    ? `${window.location.origin}/api` 
    : 'http://localhost:8080/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('cloudpark_token') || null;
        this.user = JSON.parse(localStorage.getItem('cloudpark_user') || 'null');
    }

    setAuth(authResponse) {
        if (authResponse && authResponse.token) {
            this.token = authResponse.token;
            this.user = {
                email: authResponse.email,
                name: authResponse.name,
                role: authResponse.role
            };
            localStorage.setItem('cloudpark_token', this.token);
            localStorage.setItem('cloudpark_user', JSON.stringify(this.user));
        }
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('cloudpark_token');
        localStorage.removeItem('cloudpark_user');
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type');
            let data = null;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                if (response.status === 401 || (response.status === 403 && !endpoint.includes('/auth/'))) {
                    // Token expired or invalid session
                    console.warn('Session expired or unauthorized, clearing local auth state');
                    this.clearAuth();
                    if (window.app && typeof window.app.updateAuthUI === 'function') {
                        window.app.updateAuthUI();
                    }
                }
                const errorMessage = (data && data.message) ? data.message : (typeof data === 'string' ? data : `HTTP ${response.status}`);
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setAuth(data);
        return data;
    }

    async register(name, email, password, role = 'ROLE_USER') {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role })
        });
        this.setAuth(data);
        return data;
    }

    // Lots
    async getLots() {
        return await this.request('/lots');
    }

    async createLot(lotData) {
        return await this.request('/lots', {
            method: 'POST',
            body: JSON.stringify(lotData)
        });
    }

    // Spaces
    async getSpacesForLot(lotId) {
        try {
            // First attempt to get ALL spaces (including occupied/reserved)
            return await this.request(`/spaces/lot/${lotId}/all`);
        } catch (e) {
            // Fallback to default endpoint if not available
            return await this.request(`/spaces/lot/${lotId}`);
        }
    }

    async addSpace(lotId, spaceNumber, type = 'STANDARD') {
        return await this.request('/spaces', {
            method: 'POST',
            body: JSON.stringify({ lotId, spaceNumber, type })
        });
    }

    async updateSpaceStatus(spaceId, status) {
        return await this.request(`/spaces/${spaceId}/status?status=${encodeURIComponent(status)}`, {
            method: 'PATCH'
        });
    }

    // Bookings
    async createBooking(spaceId, userEmail, startTime, endTime) {
        return await this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify({
                spaceId,
                userEmail,
                startTime,
                endTime
            })
        });
    }

    async cancelBooking(bookingId) {
        return await this.request(`/bookings/${bookingId}/cancel`, {
            method: 'PUT'
        });
    }

    async getUserBookings(email) {
        return await this.request(`/bookings?email=${encodeURIComponent(email)}`);
    }

    // Analytics (Admin)
    async getLotOccupancy(lotId) {
        return await this.request(`/analytics/lots/${lotId}/occupancy`);
    }

    async getLotRevenue(lotId) {
        return await this.request(`/analytics/lots/${lotId}/revenue`);
    }

    // Health
    async checkHealth() {
        return await this.request('/health');
    }
}

window.api = new ApiService();
