const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = RAW_API_URL.endsWith('/api/v1') ? RAW_API_URL : `${RAW_API_URL.replace(/\/+$/, '')}/api/v1`;

// Token management
let accessToken: string | null = null;

export function getAccessToken() {
    if (!accessToken) {
        accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    }
    return accessToken;
}

export function setAccessToken(token: string | null) {
    accessToken = token;
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('accessToken', token);
        } else {
            localStorage.removeItem('accessToken');
        }
    }
}

function getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? match[1] : null;
}

let csrfPromise: Promise<void> | null = null;
async function fetchCsrfToken() {
    if (csrfPromise) return csrfPromise;
    csrfPromise = fetch(`${API_BASE.replace('/api/v1', '')}/`, { credentials: 'include' })
        .then(() => { })
        .catch(() => { })
        .finally(() => { csrfPromise = null; });
    return csrfPromise;
}

async function request(endpoint: string, options: RequestInit = {}) {
    const token = getAccessToken();
    let csrfToken = getCsrfToken();

    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET');

    // Auto-fetch CSRF token if missing before state-changing requests
    if (isStateChanging && !csrfToken) {
        await fetchCsrfToken();
        csrfToken = getCsrfToken();
    }

    const config: RequestInit = {
        ...options,
        credentials: 'include',
        headers: {
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
            ...((options.headers as Record<string, string>) || {}),
        },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // If unauthorized, try refresh
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        const refreshed = await refreshToken();
        if (refreshed) {
            // Retry with new token
            const newToken = getAccessToken();
            const retryConfig: RequestInit = {
                ...config,
                headers: {
                    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
                    ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
                },
            };
            const retryResponse = await fetch(`${API_BASE}${endpoint}`, retryConfig);
            if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({}));
                throw new ApiError(errorData.message || 'Request failed', retryResponse.status);
            }
            return retryResponse;
        }
        setAccessToken(null);
        throw new ApiError('Session expired. Please login again.', 401);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.message || errorData.errors?.map((e: { message: string }) => e.message).join(', ') || 'Request failed',
            response.status
        );
    }

    return response;
}

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

// ============ AUTH ENDPOINTS ============

export async function getCaptcha() {
    const res = await request('/auth/captcha');
    const data = await res.json();
    return data.data; // { id: string, svg: string }
}

export async function sendRegistrationOtp(email: string) {
    const res = await request('/otp/send-registration-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    return res.json();
}

export async function sendUpdateOtp(type: 'email' | 'phone') {
    const res = await request('/otp/send-update-otp', {
        method: 'POST',
        body: JSON.stringify({ type }),
    });
    return res.json();
}

export async function register(
    email: string, 
    password: string, 
    username: string, 
    captcha_id: string, 
    captcha_text: string, 
    otp_code: string,
    public_key: string,
    security_pin: string
) {
    const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username, captcha_id, captcha_text, otp_code, public_key, security_pin }),
    });
    const data = await res.json();
    setAccessToken(data.data.accessToken);
    return data;
}

export async function login(identifier: string, password: string, captcha_id: string, captcha_text: string) {
    const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, captcha_id, captcha_text }),
    });
    const data = await res.json();
    if (data.data.mfa_required || data.data.otp_required) {
        return data.data;
    }
    setAccessToken(data.data.accessToken);
    return data.data;
}

export async function verifyLoginOtp(temp_token: string, email_otp: string, phone_otp?: string, new_device?: boolean) {
    const res = await request('/auth/verify-login-otp', {
        method: 'POST',
        body: JSON.stringify({ temp_token, email_otp, phone_otp, new_device }),
    });
    const data = await res.json();
    setAccessToken(data.data.accessToken);
    return data.data;
}

export async function verifyMfa(temp_token: string, mfa_token: string) {
    const res = await request('/auth/verify-mfa', {
        method: 'POST',
        body: JSON.stringify({ temp_token, mfa_token }),
    });
    const data = await res.json();
    setAccessToken(data.data.accessToken);
    return data.data;
}

export async function setupMFA() {
    const res = await request('/mfa/setup', { method: 'POST' });
    const data = await res.json();
    return data.data;
}

export async function enableMFA(token: string) {
    const res = await request('/mfa/enable', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return data.data;
}

export async function disableMFA(token: string) {
    const res = await request('/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
    const data = await res.json();
    return data.data;
}

export async function refreshToken(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return false;
        const data = await res.json();
        setAccessToken(data.data.accessToken);
        return true;
    } catch {
        return false;
    }
}

export async function logout() {
    try {
        await request('/auth/logout', { method: 'POST' });
    } catch {
        // Ignore errors on logout
    }
    setAccessToken(null);
}

export async function logoutAll() {
    try {
        await request('/auth/logout-all', { method: 'POST' });
    } catch {
        // Ignore errors
    }
    setAccessToken(null);
}

export async function getMe() {
    const res = await request('/auth/me');
    const data = await res.json();
    return data.data.user;
}

// ============ UNLOCK ENDPOINTS ============

export async function requestUnlock(email: string) {
    const res = await request('/auth/unlock/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    return res.json();
}

export async function verifyUnlock(token: string) {
    const res = await request(`/auth/unlock/verify?token=${token}`, { method: 'POST' });
    const data = await res.json();
    if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
    }
    return data.data;
}

export async function getAiChallenge() {
    const res = await request('/auth/unlock/challenge', { method: 'GET' });
    const data = await res.json();
    return data.data;
}

export async function verifyAiChallenge(answers: (number | string)[]) {
    const res = await request('/auth/unlock/challenge/verify', {
        method: 'POST',
        body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    return data.data;
}

export async function resetCredentials(reset_token: string, new_password: string) {
    const res = await request('/auth/unlock/reset-credentials', {
        method: 'POST',
        body: JSON.stringify({ reset_token, new_password }),
    });
    const data = await res.json();
    if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
    }
    return data.data;
}

// ============ FILE ENDPOINTS ============

export interface FileItem {
    id: string;
    original_filename: string;
    file_size: number;
    encrypted_size: number;
    mime_type: string;
    file_extension: string;
    description: string | null;
    access_count: number;
    last_accessed: string | null;
    created_at: string;
    updated_at: string;
}

export async function uploadFile(file: File, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
        formData.append('description', description);
    }
    const res = await request('/files/upload', {
        method: 'POST',
        body: formData,
    });
    return res.json();
}

export async function getFiles(page = 1, limit = 20, sortBy = 'created_at', order = 'DESC') {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, order });
    const res = await request(`/files?${params}`);
    return res.json();
}

export async function getFileMetadata(fileId: string) {
    const res = await request(`/files/${fileId}`);
    return res.json();
}

export async function downloadFile(fileId: string, filename: string, pin?: string) {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/files/${fileId}/download`, {
        credentials: 'include',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(pin ? { 'x-security-pin': pin } : {}),
        },
    });

    if (!res.ok) {
        let errorMessage = 'Download failed';
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) { /* ignore parse error if not JSON */ }
        throw new ApiError(errorMessage, res.status);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    return blob;
}

export async function deleteFile(fileId: string) {
    const res = await request(`/files/${fileId}`, { method: 'DELETE' });
    return res.json();
}

// ============ SESSION ENDPOINTS ============

export interface Session {
    id: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
    expires_at: string;
    is_current: boolean;
}

export async function getSessions(): Promise<Session[]> {
    const res = await request('/auth/sessions');
    const data = await res.json();
    return data.data.sessions;
}

export async function revokeSession(sessionId: string) {
    const res = await request(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
    return res.json();
}

// ============ AUDIT LOG ENDPOINTS ============

export interface AuditLogEntry {
    id: string;
    event_type: string;
    event_description: string;
    ip_address: string;
    user_agent: string;
    status: string;
    created_at: string;
}

export async function getAuditLogs(page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await request(`/auth/audit-logs?${params}`);
    const data = await res.json();
    return data.data;
}

// ============ PROFILE ENDPOINTS ============

export async function getProfile() {
    const res = await request('/profile');
    const data = await res.json();
    return data.data.user;
}

export async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await request('/profile/avatar', {
        method: 'POST',
        body: formData,
    });
    const data = await res.json();
    return data.data;
}

export async function updateProfileInfo(updates: any) {
    const res = await request('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.data.user;
}

export async function updateEmail(new_email: string, otp_code: string) {
    const res = await request('/profile/email', {
        method: 'PUT',
        body: JSON.stringify({ new_email, otp_code }),
    });
    const data = await res.json();
    return data.data.user;
}

export async function updatePhone(new_phone: string, otp_code?: string) {
    const res = await request('/profile/phone', {
        method: 'PUT',
        body: JSON.stringify({ new_phone, otp_code }),
    });
    const data = await res.json();
    return data.data.user;
}

export async function changePassword(current_password: string, new_password: string) {
    const res = await request('/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password, new_password }),
    });
    return res.json();
}

export async function getStorageStats() {
    const res = await request('/profile/storage');
    const data = await res.json();
    return data.data;
}

export async function getActivityLog() {
    const res = await request('/profile/activity');
    const data = await res.json();
    return data.data;
}

export async function getSecurityInfo() {
    const res = await request('/profile/security');
    const data = await res.json();
    return data.data;
}

export async function downloadLogArchive(pin: string) {
    const res = await request('/profile/log-archive', {
        method: 'POST',
        headers: { 'x-security-pin': pin }
    });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function deleteEverything() {
    const res = await request('/profile/delete-everything', { method: 'DELETE' });
    const data = await res.json();
    return data;
}

export async function deleteAccount() {
    const res = await request('/profile/delete-account', { method: 'DELETE' });
    const data = await res.json();
    return data;
}

// ============ NOTIFICATION ENDPOINTS ============


export async function getNotifications(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const res = await request(`/notifications?limit=${limit}&offset=${offset}`);
    const data = await res.json();
    return data.data;
}

export async function markNotificationAsRead(id: string) {
    const res = await request(`/notifications/${id}/read`, { method: 'PUT' });
    return res.json();
}

export async function markAllNotificationsAsRead() {
    const res = await request('/notifications/read-all', { method: 'PUT' });
    return res.json();
}

export async function deleteNotification(id: string) {
    const res = await request(`/notifications/${id}`, { method: 'DELETE' });
    return res.json();
}

export async function deleteAllNotifications() {
    const res = await request('/notifications/clear-all', { method: 'DELETE' });
    return res.json();
}

// ============ SHARING ENDPOINTS ============

export async function createShare(fileId: string, options: { 
    accessType?: 'public' | 'password_protected', 
    expiresAt?: string, 
    maxDownloads?: number, 
    password?: string 
}) {
    const res = await request('/shares', {
        method: 'POST',
        body: JSON.stringify({ fileId, ...options }),
    });
    const data = await res.json();
    return data.data; // { share_token }
}

export async function getSharedInfo(token: string) {
    const res = await request(`/shares/${token}`);
    const data = await res.json();
    return data.data;
}

export async function downloadSharedFile(token: string, filename: string, password?: string) {
    const res = await fetch(`${API_BASE}/shares/${token}/download${password ? `?password=${encodeURIComponent(password)}` : ''}`, {
        method: password ? 'POST' : 'GET',
        credentials: 'include',
        ...(password ? { 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }) 
        } : {})
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(err.message || 'Download failed', res.status);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

// ==================== CONNECTIONS ====================

export async function sendConnectionRequest(identifier: string) {
    const res = await request('/connections/request', {
        method: 'POST',
        body: JSON.stringify({ identifier }),
    });
    const data = await res.json();
    return data.data;
}

export async function getConnections() {
    const res = await request('/connections');
    const data = await res.json();
    return data.data;
}

export async function acceptConnection(connectionId: string) {
    const res = await request(`/connections/${connectionId}/accept`, { method: 'PUT' });
    const data = await res.json();
    return data.data;
}

export async function rejectConnection(connectionId: string) {
    const res = await request(`/connections/${connectionId}/reject`, { method: 'PUT' });
    const data = await res.json();
    return data.data;
}

export async function revokeConnection(connectionId: string) {
    const res = await request(`/connections/${connectionId}`, { method: 'DELETE' });
    const data = await res.json();
    return data;
}

export async function getSafetyNumber(connectionId: string) {
    const res = await request(`/connections/${connectionId}/safety-number`);
    const data = await res.json();
    return data.data;
}

export async function verifyConnection(connectionId: string) {
    const res = await request(`/connections/${connectionId}/verify`, { method: 'PUT' });
    const data = await res.json();
    return data.data;
}

export async function searchUsers(q: string) {
    const res = await request(`/connections/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    return data.data;
}

// ==================== ADVANCED P2PE SHARES ====================

export async function createAdvancedShare(payload: {
    fileId: string; receiverId: string; encryptedAesKey: string;
    permissionMode: string; expiresAt?: string;
}) {
    const res = await request('/advanced-shares', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.data;
}

export async function getSentShares() {
    const res = await request('/advanced-shares/sent');
    const data = await res.json();
    return data.data;
}

export async function getReceivedShares() {
    const res = await request('/advanced-shares/received');
    const data = await res.json();
    return data.data;
}

export async function acceptAdvancedShare(shareId: string) {
    const res = await request(`/advanced-shares/${shareId}/accept`, { method: 'PUT' });
    const data = await res.json();
    return data.data;
}

export async function rejectAdvancedShare(shareId: string) {
    const res = await request(`/advanced-shares/${shareId}/reject`, { method: 'PUT' });
    const data = await res.json();
    return data;
}

export async function revokeAdvancedShare(shareId: string) {
    const res = await request(`/advanced-shares/${shareId}/revoke`, { method: 'PUT' });
    const data = await res.json();
    return data.data;
}

export async function trackShareView(shareId: string) {
    const res = await request(`/advanced-shares/${shareId}/track-view`, { method: 'PUT' });
    const data = await res.json();
    return data.data;
}

export async function trackShareDownload(shareId: string) {
    const res = await request(`/advanced-shares/${shareId}/track-download`, { method: 'PUT' });
    const data = await res.json();
    return data.data;
}

export async function requestPinUpdateOtp() {
    return await request('/profile/security-pin/request-otp', {
        method: 'POST'
    });
}

export async function updateSecurityPin(data: { new_pin: string, otp_code?: string, mfa_token?: string }) {
    return await request('/profile/security-pin/update', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function revokeAllShares(fileId: string) {
    const res = await request(`/files/${fileId}/revoke-all`, { method: 'PUT' });
    return res.json();
}
