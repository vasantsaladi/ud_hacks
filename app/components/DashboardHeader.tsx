"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

const DashboardHeader: React.FC = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">Canvas Assistant</h1>
          <nav className="ml-8 hidden md:block">
            <ul className="flex space-x-6">
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/analytics"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  href="/statistics"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Statistics
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
