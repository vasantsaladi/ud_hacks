"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import DashboardHeader from "@/app/components/DashboardHeader";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface AnalyticsData {
  assignment_completion: {
    assignment_name: string;
    completion_rate: number;
  }[];
  grade_distribution: {
    [key: string]: {
      min: number;
      max: number;
      avg: number;
    };
  };
  time_spent: any[];
}

export default function Analytics() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Fetch courses
    const fetchCourses = async () => {
      try {
        const response = await fetch(`/api/py/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const data = await response.json();
        setCourses(data);

        // Select first course by default if available
        if (data.length > 0 && !selectedCourse) {
          setSelectedCourse(data[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated, router, token, selectedCourse]);

  // Fetch analytics data when course is selected
  useEffect(() => {
    if (!selectedCourse || !token) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/py/analytics/${selectedCourse}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        const data = await response.json();
        setAnalyticsData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data");
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedCourse, token]);

  if (loading) {
    return <LoadingSpinner message="Loading analytics data..." />;
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
          onClick={() => router.push("/dashboard")}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Course Analytics
        </h1>

        {/* Course selector */}
        <div className="mb-8 max-w-md">
          <label
            htmlFor="course-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select Course
          </label>
          <select
            id="course-select"
            value={selectedCourse || ""}
            onChange={(e) =>
              setSelectedCourse(e.target.value ? Number(e.target.value) : null)
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="" disabled>
              Select a course
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {analyticsData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assignment Completion Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Assignment Completion Rates
              </h2>
              <div className="space-y-4">
                {analyticsData.assignment_completion.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {item.assignment_name}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(item.completion_rate * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${Math.round(item.completion_rate * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Grade Distribution</h2>
              {Object.keys(analyticsData.grade_distribution).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(analyticsData.grade_distribution).map(
                    ([assignment, grades], index) => (
                      <div key={index}>
                        <h3 className="text-md font-medium text-gray-800 mb-2">
                          {assignment}
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-green-100 p-3 rounded">
                            <p className="text-xs text-gray-500">Minimum</p>
                            <p className="text-lg font-semibold">
                              {grades.min.toFixed(1)}
                            </p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded">
                            <p className="text-xs text-gray-500">Average</p>
                            <p className="text-lg font-semibold">
                              {grades.avg.toFixed(1)}
                            </p>
                          </div>
                          <div className="bg-purple-100 p-3 rounded">
                            <p className="text-xs text-gray-500">Maximum</p>
                            <p className="text-lg font-semibold">
                              {grades.max.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">No grade data available</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a course to view analytics</p>
          </div>
        )}
      </main>
    </div>
  );
}
