"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for debugging purposes
    console.error("Dashboard error:", error);
  }, [error]);

  const isAuthError =
    error.message?.toLowerCase().includes("401") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("token") ||
    (error as any).status === 401 ||
    (error as any).response?.status === 401;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl max-w-lg w-full text-center shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-red-500">
          {isAuthError ? "Session Expired" : "Something went wrong"}
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          {isAuthError
            ? "Your Git provider access token is expired or invalid. Please sign out and log in again to refresh your session."
            : error.message || "An unexpected error occurred while communicating with the Git provider."}
        </p>
        <div className="flex gap-4 justify-center">
          {!isAuthError && (
            <button
              onClick={() => reset()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={`${
              isAuthError
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-700 hover:bg-gray-600 border border-gray-600"
            } text-white px-6 py-2 rounded-lg font-medium transition-colors`}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
