"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import DashboardHeader from "@/app/components/DashboardHeader";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import SmalltalkVisualization from "@/app/components/SmalltalkVisualization";
import AdvancedSmalltalkVisualization from "@/app/components/AdvancedSmalltalkVisualization";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface CourseStatistics {
  course_name: string;
  course_code: string;
  total_assignments: number;
  completed_assignments: number;
  completion_percentage: number;
  upcoming_assignments: number;
  past_due_assignments: number;
  total_points: number;
  earned_points: number;
  grade_percentage: number;
  assignments_by_type: {
    [key: string]: number;
  };
  time_distribution: {
    [key: string]: number;
  };
}

export default function Statistics() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<CourseStatistics | null>(null);
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

        // Find the 314-statistics course or select first course by default
        const statisticsCourse = data.find((course: Course) =>
          course.code.includes("314-statistics")
        );

        if (statisticsCourse) {
          setSelectedCourse(statisticsCourse.id);
        } else if (data.length > 0 && !selectedCourse) {
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
  }, [isAuthenticated, router, token]);

  // Fetch statistics data when course is selected
  useEffect(() => {
    if (!selectedCourse || !token) return;

    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/py/course_statistics/${selectedCourse}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch statistics data");
        }
        const data = await response.json();
        setStatistics(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError("Failed to load statistics data");
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [selectedCourse, token]);

  if (loading) {
    return <LoadingSpinner message="Loading statistics data..." />;
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
          Course Statistics
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
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>

        {statistics ? (
          <div className="space-y-8">
            {/* Course Overview */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Course Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Course</h3>
                  <p className="text-lg font-bold">{statistics.course_name}</p>
                  <p className="text-sm text-gray-500">
                    {statistics.course_code}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">
                    Current Grade
                  </h3>
                  <p className="text-2xl font-bold">
                    {statistics.grade_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {statistics.earned_points.toFixed(1)} /{" "}
                    {statistics.total_points.toFixed(1)} points
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">
                    Completion
                  </h3>
                  <p className="text-2xl font-bold">
                    {statistics.completion_percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {statistics.completed_assignments} /{" "}
                    {statistics.total_assignments} assignments
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">
                    Upcoming
                  </h3>
                  <p className="text-2xl font-bold">
                    {statistics.upcoming_assignments}
                  </p>
                  <p className="text-sm text-gray-500">
                    {statistics.past_due_assignments} past due
                  </p>
                </div>
              </div>

              {/* Grade Pie Chart */}
              <div className="mt-8">
                <h3 className="text-md font-medium text-gray-700 mb-4">
                  Grade Distribution
                </h3>
                <AdvancedSmalltalkVisualization
                  title="Course Grade Breakdown"
                  chartType="pie"
                  data={[
                    {
                      label: "Earned",
                      value: statistics.earned_points,
                      color: "#10b981", // green
                    },
                    {
                      label: "Remaining",
                      value: statistics.total_points - statistics.earned_points,
                      color: "#f97316", // orange
                    },
                  ]}
                  height={300}
                  width={600}
                  animate={true}
                />
              </div>
            </div>

            {/* Assignment Progress */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Assignment Progress
              </h2>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {statistics.completion_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${statistics.completion_percentage}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-700 mb-2">
                    Completed
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {statistics.completed_assignments}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-700 mb-2">
                    Remaining
                  </h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {statistics.total_assignments -
                      statistics.completed_assignments}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Types */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Assignment Types</h2>
              {Object.keys(statistics.assignments_by_type).length > 0 ? (
                <>
                  <div className="space-y-4 mb-8">
                    {Object.entries(statistics.assignments_by_type).map(
                      ([type, count], index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {type}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {count} assignments
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{
                                width: `${
                                  (count / statistics.total_assignments) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Advanced Smalltalk Visualizations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                    {/* Bar Chart */}
                    <div>
                      <h3 className="text-md font-medium text-gray-700 mb-4">
                        Assignment Types
                      </h3>
                      <AdvancedSmalltalkVisualization
                        title="Assignment Distribution by Type"
                        chartType="bar"
                        data={Object.entries(
                          statistics.assignments_by_type
                        ).map(([type, count]) => ({
                          label: type.charAt(0).toUpperCase() + type.slice(1),
                          value: count,
                        }))}
                        height={300}
                        width={400}
                        animate={true}
                      />
                    </div>

                    {/* Line Chart */}
                    <div>
                      <h3 className="text-md font-medium text-gray-700 mb-4">
                        Assignment Distribution Trend
                      </h3>
                      <AdvancedSmalltalkVisualization
                        title="Assignment Types Distribution"
                        chartType="line"
                        data={Object.entries(
                          statistics.assignments_by_type
                        ).map(([type, count]) => ({
                          label: type.charAt(0).toUpperCase() + type.slice(1),
                          value: count,
                        }))}
                        height={300}
                        width={400}
                        animate={true}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">
                  No assignment type data available
                </p>
              )}
            </div>

            {/* Time Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Weekly Distribution
              </h2>

              {/* Original visualization */}
              <div className="grid grid-cols-7 gap-2 mb-8">
                {Object.entries(statistics.time_distribution).map(
                  ([day, count], index) => (
                    <div key={index} className="text-center">
                      <div
                        className="mx-auto mb-2 rounded-md"
                        style={{
                          height: `${Math.max(20, count * 15)}px`,
                          width: "80%",
                          backgroundColor: count > 0 ? "#4f46e5" : "#e5e7eb",
                        }}
                      ></div>
                      <p className="text-xs font-medium">
                        {day.substring(0, 3)}
                      </p>
                      <p className="text-sm font-bold">{count}</p>
                    </div>
                  )
                )}
              </div>

              {/* Advanced Smalltalk Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                {/* Bar Chart */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-4">
                    Bar Chart View
                  </h3>
                  <AdvancedSmalltalkVisualization
                    title="Assignments by Day of Week"
                    chartType="bar"
                    data={Object.entries(statistics.time_distribution).map(
                      ([day, count]) => ({
                        label: day.substring(0, 3),
                        value: count,
                      })
                    )}
                    height={300}
                    width={400}
                    animate={true}
                  />
                </div>

                {/* Radar Chart */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-4">
                    Radar Chart View
                  </h3>
                  <AdvancedSmalltalkVisualization
                    title="Weekly Assignment Distribution"
                    chartType="radar"
                    data={Object.entries(statistics.time_distribution).map(
                      ([day, count]) => ({
                        label: day.substring(0, 3),
                        value: count,
                      })
                    )}
                    height={300}
                    width={400}
                    animate={true}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a course to view statistics</p>
          </div>
        )}
      </main>
    </div>
  );
}
