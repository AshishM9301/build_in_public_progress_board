"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaTwitter } from "react-icons/fa6";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { login, socialLogin } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await login(email, password);

            if (result.success) {
                router.push("/dashboard");
            } else {
                setError("Login failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };


    const handleGoogleLogin = async () => {

        const result = await socialLogin("google");

        console.log("result--->", result);
        if (result.success) {
            router.push("/dashboard");
        } else {
            setError("Login failed");
        }
    };

    const handleTwitterLogin = async () => {
        const result = await socialLogin("twitter");
        console.log("result--->", result);
    };

    return (
        <div className="min-h-screen flex">
            <div className="w-1/2 relative">
                <Image src="/assets/images/auth.jpg" alt="Login" fill className="object-cover max-w-full h-full" />
            </div>
            <div className="w-1/2 flex items-center justify-center">

                <div className="max-w-md w-full space-y-8 p-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Welcome back to your account
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center"
                            >
                                {isLoading ? "Signing in..." : "Sign in"}
                            </Button>

                        </div>
                    </form>
                    <div className="flex flex-col gap-2">
                        <Button variant="outline" className="group relative w-full flex justify-center" onClick={handleGoogleLogin}>
                            <FaGoogle className="w-4 h-4 mr-2" />
                            Sign in with Google
                        </Button>
                        <Button variant="outline" className="group relative w-full flex justify-center" onClick={handleTwitterLogin}>
                            <FaTwitter className="w-4 h-4 mr-2" />
                            Sign in with Twitter
                        </Button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="font-medium text-primary hover:text-primary/80">
                                Sign up
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
