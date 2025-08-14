import { devLog } from '@/app/_common/utils/logger';
import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { setCookieAuth, getAuthCookie, clearAllAuth } from '@/app/_common/utils/cookieUtils';
import { generateSha256Hash } from '@/app/_common/utils/generateSha1Hash';
import { apiClient } from './apiClient';
import type { SignupData, LoginData, AuthResponse, TokenValidationResponse, User } from '@/types/auth';

const _signup = async (signupData: SignupData): Promise<any> => {
    const hashedSignupData = {
        ...signupData,
        password: generateSha256Hash(signupData.password!),
    };

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(hashedSignupData),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.detail || `HTTP error! status: ${response.status}`);
    }
    return result;
};
export const signup = withErrorHandler(_signup, 'Failed to signup');

const _login = async (loginData: LoginData): Promise<AuthResponse> => {
    const hashedLoginData = {
        ...loginData,
        password: generateSha256Hash(loginData.password!),
    };

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(hashedLoginData),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.detail || `HTTP error! status: ${response.status}`);
    }

    if (result.access_token) setCookieAuth('access_token', result.access_token);
    if (result.refresh_token) setCookieAuth('refresh_token', result.refresh_token);
    if (result.user_id) setCookieAuth('user_id', result.user_id.toString());
    if (result.username) setCookieAuth('username', result.username);

    return result;
};
export const login = withErrorHandler(_login, 'Failed to login');

const _logout = async (token: string | null = null): Promise<{ message: string }> => {
    const authToken = token || getAuthCookie('access_token');
    if (!authToken) {
        devLog.warn('Logout attempted without a token.');
        clearAllAuth();
        return { message: 'No token found, cleared local auth info.' };
    }

    try {
        await apiClient(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            body: JSON.stringify({ token: authToken }),
        });
    } finally {
        clearAllAuth();
    }

    return { message: 'Logout successful' };
};
export const logout = withErrorHandler(_logout, 'Failed to logout');

export const validateToken = async (token: string | null = null): Promise<TokenValidationResponse> => {
    const authToken = token || getAuthCookie('access_token');
    if (!authToken) return { valid: false };

    try {
        const response = await apiClient(`${API_BASE_URL}/auth/validate-token?token=${encodeURIComponent(authToken)}`);
        if (!response.ok) return { valid: false };
        return await response.json();
    } catch (error) {
        devLog.error('Token validation request failed:', error);
        return { valid: false };
    }
};

const _refreshToken = async (token: string | null = null): Promise<AuthResponse> => {
    const refToken = token || getAuthCookie('refresh_token');
    if (!refToken) throw new Error('No refresh token found');

    const response = await apiClient(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refToken }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to refresh token');
    }

    const result: AuthResponse = await response.json();
    if (result.access_token) {
        setCookieAuth('access_token', result.access_token);
    }
    return result;
};
export const refreshToken = withErrorHandler(_refreshToken, 'Failed to refresh token');

export const getCurrentUser = (): User | null => {
    try {
        const userId = getAuthCookie('user_id');
        const username = getAuthCookie('username');
        const accessToken = getAuthCookie('access_token');

        if (!userId || !username || !accessToken) return null;

        return {
            user_id: parseInt(userId, 10),
            username,
            access_token: accessToken,
        };
    } catch (error) {
        devLog.error('Failed to get current user from cookie:', error);
        return null;
    }
};

export const isLoggedIn = (): boolean => {
    return getCurrentUser() !== null;
};

const generateRandomId = (): string => {
    return Math.random().toString(36).substring(2, 10);
};

const generateRandomPassword = (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

const _createGuestAccountAndLogin = async (): Promise<AuthResponse> => {
    const randomId = generateRandomId();
    const guestUsername = `guest_${randomId}`;
    const guestEmail = `guest_${randomId}@guest.com`;
    const guestPassword = generateRandomPassword();

    await signup({
        username: guestUsername,
        email: guestEmail,
        password: guestPassword,
        full_name: `Guest User ${randomId}`,
    });

    const loginResult = await login({
        email: guestEmail,
        password: guestPassword,
    });

    return {
        ...loginResult,
        isGuest: true,
        guestInfo: {
            username: guestUsername,
            email: guestEmail,
        },
    };
};
export const createGuestAccountAndLogin = withErrorHandler(_createGuestAccountAndLogin, 'Failed to create guest account');
