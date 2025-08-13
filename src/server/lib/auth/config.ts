import { db } from "@/server/db";
import type { BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = db;

export const config = {
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Set to true if you want email verification
    },
    pages: {
        signIn: "/login",
        signUp: "/register",
        error: "/login",
    },
    callbacks: {
        onSignIn: async () => {
            // You can add custom logic here when user signs in
            return true;
        },
        onSignUp: async () => {
            // You can add custom logic here when user signs up
            return true;
        },
    },
    session: {
        strategy: "database",
        updateAge: 24 * 60 * 60, // 24 hours
    },
} as BetterAuthOptions;