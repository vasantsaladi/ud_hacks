"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setError("Authentication failed: " + error);
      setLoading(false);
      return;
    }

    if (!code) {
      setError("No authorization code received");
      setLoading(false);
      return;
    }

    // Exchange code for token
    const exchangeCodeForToken = async () => {
      try {
        const response = await fetch("/api/py/auth/canvas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            redirect_uri: process.env.NEXT_PUBLIC_CANVAS_REDIRECT_URI,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange code for token");
        }

        const data = await response.json();
        login(data.access_token, data.user_id);

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Failed to authenticate with Canvas");
        setLoading(false);
      }
    };

    exchangeCodeForToken();
  }, [searchParams, login, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-xl">Authenticating with Canvas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return null;
}
