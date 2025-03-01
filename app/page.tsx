"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!token.trim()) {
      setError("Please enter your Canvas API token");
      setIsLoading(false);
      return;
    }

    try {
      // Test the token by making a request to the courses endpoint
      const response = await fetch("/api/py/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid token or API error");
      }

      // If successful, log the user in
      login(token, 0); // We don't have a user ID with direct token auth
      router.push("/dashboard");
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        "Failed to authenticate. Please check your token and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-4xl flex flex-col items-center text-center">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-4">
            Canvas Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Manage your Canvas assignments with AI-powered prioritization and
            summarization
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={handleCanvasLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Connect with Canvas
          </button>
          <a
            href="/gemini"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Gemini AI
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-3xl mb-12">
          <div className="grid md:grid-cols-2">
            <div className="p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Simplify Your Learning Journey
              </h2>
              <ul className="text-left space-y-3">
                <li className="flex items-start">
                  <svg
                    className="h-6 w-6 text-green-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Prioritized assignments based on due dates and importance
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-6 w-6 text-green-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    AI-generated summaries of assignment descriptions
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-6 w-6 text-green-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Visual analytics to track your progress
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-blue-600 p-8 flex items-center justify-center">
              <div className="text-center w-full">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Get Started Now
                </h3>
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Enter your Canvas API token"
                      className="w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>
                  {error && <p className="text-red-200 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center w-full"
                  >
                    {isLoading ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 2L2 7L12 12L22 7L12 2Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 17L12 22L22 17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 12L12 17L22 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Login with Canvas Token
                      </>
                    )}
                  </button>
                </form>
                <p className="text-blue-100 mt-4 text-sm">
                  Enter the Canvas API token from your Canvas settings
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-500 mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Prioritization</h3>
            <p className="text-gray-600">
              Automatically prioritize assignments based on due dates, points,
              and complexity.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-500 mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Summaries</h3>
            <p className="text-gray-600">
              Get concise summaries of assignment descriptions powered by
              Google's Gemini AI.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-500 mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Visual Analytics</h3>
            <p className="text-gray-600">
              Track your progress with intuitive visualizations and performance
              insights.
            </p>
          </div>
        </div>

        <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
          <a
            href="/gemini"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h2 className={`mb-3 text-2xl font-semibold`}>
              Gemini AI{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
              Try out the Gemini AI integration.
            </p>
          </a>

          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className={`mb-3 text-2xl font-semibold`}>
              Next.js Docs{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
              Find in-depth information about Next.js features and API.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
