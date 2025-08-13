"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
            router.push("/");
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                        {user && (
                            <p className="text-white/80 mt-2">
                                Welcome back, {user.name}! ({user.email})
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                        {isLoading ? "Signing out..." : "Sign out"}
                    </button>
                </div>

                {/* Welcome Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Welcome to your dashboard! 🎉
                    </h2>
                    <p className="text-gray-600 mb-4">
                        This is a protected page that only authenticated users can access.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <p className="text-blue-800 text-sm">
                            <strong>Note:</strong> This is a demo dashboard. The actual authentication
                            will be implemented with Better Auth integration.
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Post</h3>
                        <p className="text-gray-600 mb-4">
                            Use the tRPC private procedures to create new posts.
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Try it out
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">View Posts</h3>
                        <p className="text-gray-600 mb-4">
                            See all posts created by authenticated users.
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            Browse posts
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile</h3>
                        <p className="text-gray-600 mb-4">
                            Manage your account settings and preferences.
                        </p>
                        <button className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                            Coming soon
                        </button>
                    </div>
                </div>

                {/* Status Info */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h3>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <span className="text-gray-700">User is authenticated</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <span className="text-gray-700">Route protection active</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <span className="text-gray-700">tRPC private procedures accessible</span>
                        </div>
                        {user && (
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                <span className="text-gray-700">User: {user.name} ({user.email})</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
