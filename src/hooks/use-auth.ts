"use client";

import { authClient } from "@/lib/auth-client";
import { auth } from "@/server/lib/auth";
import { useEffect, useState } from "react";

interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        // Check current session
        const checkAuth = async () => {
            try {
                // Check if there's a session cookie
                const hasSession = document.cookie.includes("better-auth-session");

                if (hasSession) {
                    // TODO: Get actual user data from Better Auth API
                    setAuthState({
                        user: {
                            id: "user-id",
                            name: "User",
                            email: "user@example.com",
                            emailVerified: true,
                        },
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    setAuthState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        };

        void checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            // Call Better Auth API
            const response = await authClient.signIn.email({
                email,
                password,
            });

            if (response.data) {
                const data = response.data;

                // Update local state
                setAuthState({
                    user: {
                        id: data.user?.id ?? "user-id",
                        name: data.user?.name ?? "User",
                        email: email,
                        emailVerified: data.user?.emailVerified ?? false,
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });

                return { success: true };
            } else {
                return { success: false, error: response.error?.message ?? "Login failed" };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: "An unexpected error occurred" };
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            // Call Better Auth API
            const response = await authClient.signUp.email({

                name: name, // required
                email: email, // required
                password: password, // required
                // image: "https://example.com/image.png",
                callbackURL: "http://localhost:3000/dashboard",

            });

            if (response.data) {

                const data = response.data;

                // Update local state
                setAuthState({
                    user: {
                        id: data.user?.id ?? "user-id",
                        name: name,
                        email: email,
                        emailVerified: data.user?.emailVerified ?? false,
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });

                return { success: true };
            } else {
                return { success: false, error: response.error };
            }
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, error: "An unexpected error occurred" };
        }
    };

    const logout = async () => {
        try {
            // Call Better Auth API
            const response = await authClient.signOut();

            if (response.data) {
                // Update local state
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });

                return { success: true };
            } else {
                return { success: false, error: response.error };
            }
        } catch (error) {
            console.error("Logout error:", error);
            return { success: false, error: "Logout failed" };
        }
    };

    return {
        ...authState,
        login,
        register,
        logout,
    };
}
