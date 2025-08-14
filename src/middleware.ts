import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/lib/auth";
import { authClient } from "./lib/auth-client";

export async function middleware(request: NextRequest) {
    try {
        const session = await authClient.getSession({
            fetchOptions: {
                headers: request.headers,
            },
        });

        // Define private routes that require authentication
        const privateRoutes = ["/dashboard", "/profile", "/settings"];
        const isPrivateRoute = privateRoutes.some(route =>
            request.nextUrl.pathname.startsWith(route)
        );

        console.log("isPrivateRoute", isPrivateRoute);

        // Redirect to login if accessing private route without session
        if (isPrivateRoute && !session?.data) {
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Redirect authenticated users away from auth pages
        const authRoutes = ["/login", "/register"];
        const isAuthRoute = authRoutes.some(route =>
            request.nextUrl.pathname.startsWith(route)
        );

        console.log("isAuthRoute", isAuthRoute);
        console.log("session", session);

        if (isAuthRoute && session?.data) {
            console.log("Redirecting to dashboard");
            const dashboardUrl = new URL("/dashboard", request.url);
            return NextResponse.redirect(dashboardUrl);
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);
        // On error, allow the request to continue (fail open for now)
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
