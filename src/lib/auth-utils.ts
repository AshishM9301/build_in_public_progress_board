import { auth } from "../server/lib/auth";

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(headers: Headers): Promise<boolean> {
    try {
        const session = await auth.api.getSession({ headers });
        return !!session && !!session.user;
    } catch {
        return false;
    }
}

/**
 * Get current user session
 */
export async function getCurrentUser(headers: Headers) {
    try {
        const session = await auth.api.getSession({ headers });
        return session?.user || null;
    } catch {
        return null;
    }
}

/**
 * Check if user has specific role (if you implement roles)
 */
export function hasRole(user: any, role: string): boolean {
    // Implement role checking logic based on your user schema
    // This is a placeholder - customize based on your needs
    return user?.role === role;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(headers: Headers) {
    const user = await getCurrentUser(headers);
    if (!user) {
        throw new Error("Authentication required");
    }
    return user;
}
