export interface SignupData {
    username: string;
    email: string;
    password?: string; // Optional because it's removed after hashing
    full_name?: string;
}

export interface LoginData {
    email: string;
    password?: string; // Optional because it's removed after hashing
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user_id: number;
    username: string;
    isGuest?: boolean;
    guestInfo?: {
        username: string;
        email: string;
    };
}

export interface TokenValidationResponse {
    valid: boolean;
}

export interface User {
    user_id: number;
    username: string;
    access_token: string;
}
