"use client";

import { api } from "@/trpc/react";
import { useState } from "react";

export function AuthExample() {
    const [postName, setPostName] = useState("");

    // Public procedure - accessible to everyone
    const helloQuery = api.post.hello.useQuery({ text: "World" });

    // Private procedure - requires authentication
    const createPostMutation = api.post.create.useMutation({
        onSuccess: () => {
            setPostName("");
            // Refetch user posts after creating
            userPostsQuery.refetch();
        },
    });

    // Private procedure - shows user-specific data
    const userPostsQuery = api.post.getUserPosts.useQuery();

    const handleCreatePost = () => {
        if (postName.trim()) {
            createPostMutation.mutate({ name: postName.trim() });
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-2">Public Query (Hello)</h3>
                <p>{helloQuery.data?.greeting || "Loading..."}</p>
            </div>

            <div className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-2">Create Post (Private)</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={postName}
                        onChange={(e) => setPostName(e.target.value)}
                        placeholder="Enter post name"
                        className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <button
                        onClick={handleCreatePost}
                        disabled={createPostMutation.isPending}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                        {createPostMutation.isPending ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>

            <div className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-2">User Posts (Private)</h3>
                {userPostsQuery.isLoading ? (
                    <p>Loading user posts...</p>
                ) : userPostsQuery.error ? (
                    <p className="text-red-500">Error: {userPostsQuery.error.message}</p>
                ) : (
                    <div>
                        <p className="mb-2">{userPostsQuery.data?.message}</p>
                        <ul className="space-y-1">
                            {userPostsQuery.data?.posts.map((post) => (
                                <li key={post.id} className="text-sm">
                                    • {post.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
